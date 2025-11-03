from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import csv
from io import StringIO
from fastapi.responses import StreamingResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'sua-chave-secreta-muito-segura-123')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ======================
# MODELS
# ======================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    email: EmailStr
    senha_hash: str = Field(exclude=True)
    tipo: str  # "admin" ou "funcionario"
    reset_token: Optional[str] = None
    reset_token_expiry: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    tipo: str = "funcionario"

class UserLogin(BaseModel):
    email: EmailStr
    senha: str

class UserResponse(BaseModel):
    id: str
    nome: str
    email: str
    tipo: str
    created_at: datetime

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    nova_senha: str

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    categoria: str
    preco: float
    quantidade: int
    validade: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    nome: str
    categoria: str
    preco: float
    quantidade: int
    validade: Optional[str] = None

class ProductUpdate(BaseModel):
    nome: Optional[str] = None
    categoria: Optional[str] = None
    preco: Optional[float] = None
    quantidade: Optional[int] = None
    validade: Optional[str] = None

class Movement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    produto_id: str
    produto_nome: str
    tipo: str  # "entrada" ou "saida"
    quantidade: int
    usuario_id: str
    usuario_nome: str
    observacao: Optional[str] = None
    data: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MovementCreate(BaseModel):
    produto_id: str
    tipo: str
    quantidade: int
    observacao: Optional[str] = None

# ======================
# HELPER FUNCTIONS
# ======================

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        
        return user_doc
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("tipo") != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores.")
    return current_user

# ======================
# AUTH ROUTES
# ======================

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Hash password
    hashed = pwd_context.hash(user_data.senha)
    
    user = User(
        nome=user_data.nome,
        email=user_data.email,
        senha_hash=hashed,
        tipo=user_data.tipo
    )
    
    doc = user.model_dump(mode='python')
    doc['senha_hash'] = hashed  # Adicionar senha_hash manualmente
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    return UserResponse(
        id=user.id,
        nome=user.nome,
        email=user.email,
        tipo=user.tipo,
        created_at=user.created_at
    )

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    senha_hash = user_doc.get("senha_hash")
    if not senha_hash or not pwd_context.verify(credentials.senha, senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = create_access_token({"sub": user_doc["id"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_doc["id"],
            "nome": user_doc["nome"],
            "email": user_doc["email"],
            "tipo": user_doc["tipo"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        nome=current_user["nome"],
        email=current_user["email"],
        tipo=current_user["tipo"],
        created_at=datetime.fromisoformat(current_user["created_at"]) if isinstance(current_user["created_at"], str) else current_user["created_at"]
    )

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    if not user_doc:
        # Return success even if user not found (security best practice)
        return {"message": "Se o email existir, você receberá instruções para resetar a senha"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.users.update_one(
        {"email": request.email},
        {"$set": {
            "reset_token": reset_token,
            "reset_token_expiry": expiry.isoformat()
        }}
    )
    
    # TODO: Send email with reset_token
    # For now, return token (in production, send via email)
    return {
        "message": "Token de recuperação gerado",
        "reset_token": reset_token  # Remove this in production
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    user_doc = await db.users.find_one({"reset_token": request.token}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=400, detail="Token inválido")
    
    expiry = datetime.fromisoformat(user_doc["reset_token_expiry"])
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Token expirado")
    
    # Update password
    hashed = pwd_context.hash(request.nova_senha)
    await db.users.update_one(
        {"reset_token": request.token},
        {"$set": {
            "senha_hash": hashed,
            "reset_token": None,
            "reset_token_expiry": None
        }}
    )
    
    return {"message": "Senha resetada com sucesso"}

# ======================
# USER ROUTES (Admin only)
# ======================

@api_router.get("/usuarios", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "senha_hash": 0}).to_list(1000)
    
    return [
        UserResponse(
            id=u["id"],
            nome=u["nome"],
            email=u["email"],
            tipo=u["tipo"],
            created_at=datetime.fromisoformat(u["created_at"]) if isinstance(u["created_at"], str) else u["created_at"]
        )
        for u in users
    ]

@api_router.post("/usuarios", response_model=UserResponse)
async def create_user(user_data: UserCreate, current_user: dict = Depends(require_admin)):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    hashed = pwd_context.hash(user_data.senha)
    
    user = User(
        nome=user_data.nome,
        email=user_data.email,
        senha_hash=hashed,
        tipo=user_data.tipo
    )
    
    doc = user.model_dump(mode='python')
    doc['senha_hash'] = hashed  # Adicionar senha_hash manualmente
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    return UserResponse(
        id=user.id,
        nome=user.nome,
        email=user.email,
        tipo=user.tipo,
        created_at=user.created_at
    )

@api_router.delete("/usuarios/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {"message": "Usuário deletado com sucesso"}

# ======================
# PRODUCT ROUTES
# ======================

@api_router.get("/produtos", response_model=List[Product])
async def list_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    
    for p in products:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        if isinstance(p.get('updated_at'), str):
            p['updated_at'] = datetime.fromisoformat(p['updated_at'])
    
    return products

@api_router.get("/produtos/baixo-estoque", response_model=List[Product])
async def low_stock_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({"quantidade": {"$lt": 5}}, {"_id": 0}).to_list(1000)
    
    for p in products:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
        if isinstance(p.get('updated_at'), str):
            p['updated_at'] = datetime.fromisoformat(p['updated_at'])
    
    return products

@api_router.get("/produtos/{product_id}", response_model=Product)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    if isinstance(product.get('updated_at'), str):
        product['updated_at'] = datetime.fromisoformat(product['updated_at'])
    
    return product

@api_router.post("/produtos", response_model=Product)
async def create_product(product_data: ProductCreate, current_user: dict = Depends(get_current_user)):
    product = Product(**product_data.model_dump())
    
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.products.insert_one(doc)
    
    return product

@api_router.put("/produtos/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, current_user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({"id": product_id})
    
    if not existing:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return updated

@api_router.delete("/produtos/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    return {"message": "Produto deletado com sucesso"}

# ======================
# MOVEMENT ROUTES
# ======================

@api_router.get("/movimentacoes", response_model=List[Movement])
async def list_movements(current_user: dict = Depends(get_current_user)):
    movements = await db.movements.find({}, {"_id": 0}).sort("data", -1).to_list(1000)
    
    for m in movements:
        if isinstance(m.get('data'), str):
            m['data'] = datetime.fromisoformat(m['data'])
    
    return movements

@api_router.get("/movimentacoes/historico/{produto_id}", response_model=List[Movement])
async def product_movement_history(produto_id: str, current_user: dict = Depends(get_current_user)):
    movements = await db.movements.find({"produto_id": produto_id}, {"_id": 0}).sort("data", -1).to_list(1000)
    
    for m in movements:
        if isinstance(m.get('data'), str):
            m['data'] = datetime.fromisoformat(m['data'])
    
    return movements

@api_router.post("/movimentacoes", response_model=Movement)
async def create_movement(movement_data: MovementCreate, current_user: dict = Depends(get_current_user)):
    # Get product
    product = await db.products.find_one({"id": movement_data.produto_id}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Update product quantity
    if movement_data.tipo == "entrada":
        new_quantity = product["quantidade"] + movement_data.quantidade
    elif movement_data.tipo == "saida":
        if product["quantidade"] < movement_data.quantidade:
            raise HTTPException(status_code=400, detail="Quantidade insuficiente em estoque")
        new_quantity = product["quantidade"] - movement_data.quantidade
    else:
        raise HTTPException(status_code=400, detail="Tipo de movimentação inválido. Use 'entrada' ou 'saida'")
    
    await db.products.update_one(
        {"id": movement_data.produto_id},
        {"$set": {
            "quantidade": new_quantity,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create movement record
    movement = Movement(
        produto_id=movement_data.produto_id,
        produto_nome=product["nome"],
        tipo=movement_data.tipo,
        quantidade=movement_data.quantidade,
        usuario_id=current_user["id"],
        usuario_nome=current_user["nome"],
        observacao=movement_data.observacao
    )
    
    doc = movement.model_dump()
    doc['data'] = doc['data'].isoformat()
    
    await db.movements.insert_one(doc)
    
    return movement

# ======================
# REPORTS ROUTES
# ======================

@api_router.get("/relatorios/dashboard")
async def dashboard_data(current_user: dict = Depends(get_current_user)):
    # Total products
    total_products = await db.products.count_documents({})
    
    # Low stock products
    low_stock_count = await db.products.count_documents({"quantidade": {"$lt": 5}})
    
    # Recent movements
    recent_movements = await db.movements.find({}, {"_id": 0}).sort("data", -1).limit(10).to_list(10)
    
    for m in recent_movements:
        if isinstance(m.get('data'), str):
            m['data'] = datetime.fromisoformat(m['data'])
    
    # Products by category
    pipeline = [
        {"$group": {"_id": "$categoria", "count": {"$sum": 1}}},
        {"$project": {"categoria": "$_id", "count": 1, "_id": 0}}
    ]
    categories = await db.products.aggregate(pipeline).to_list(100)
    
    # Movements by type (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    movements_pipeline = [
        {"$match": {"data": {"$gte": thirty_days_ago.isoformat()}}},
        {"$group": {"_id": "$tipo", "count": {"$sum": 1}}},
        {"$project": {"tipo": "$_id", "count": 1, "_id": 0}}
    ]
    movement_stats = await db.movements.aggregate(movements_pipeline).to_list(100)
    
    # Total stock value
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    total_value = sum(p.get("preco", 0) * p.get("quantidade", 0) for p in products)
    
    return {
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "total_value": total_value,
        "recent_movements": recent_movements,
        "categories": categories,
        "movement_stats": movement_stats
    }

@api_router.get("/relatorios/export")
async def export_report(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(10000)
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["ID", "Nome", "Categoria", "Preço", "Quantidade", "Validade", "Criado em"])
    
    # Data
    for p in products:
        writer.writerow([
            p.get("id", ""),
            p.get("nome", ""),
            p.get("categoria", ""),
            p.get("preco", ""),
            p.get("quantidade", ""),
            p.get("validade", ""),
            p.get("created_at", "")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=relatorio_estoque.csv"}
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()