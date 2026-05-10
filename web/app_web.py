import asyncio
import os
import sys
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Configuración de logging para diagnóstico
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger("app_web")

app = FastAPI(title="Controlador Web RobotStudio ABB")

# Directorios de archivos estáticos
static_dir = os.path.join(os.path.dirname(__file__), "static")
assets_dir = os.path.join(static_dir, "assets")

# Aseguramos que existan las carpetas para evitar errores de FastAPI al montar
os.makedirs(assets_dir, exist_ok=True)

# Montamos la carpeta static para servir el frontend y sus assets
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

process = None

def get_python_executable():
    """
    Busca el ejecutable de python en el entorno virtual .venv
    para asegurar que las dependencias de LangChain estén disponibles.
    """
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # En Windows suele estar en .venv/Scripts/python.exe
    venv_python = os.path.join(root_dir, ".venv", "Scripts", "python.exe")
    
    if os.path.exists(venv_python):
        logger.info(f"Entorno virtual detectado: {venv_python}")
        return venv_python
    
    logger.warning("No se detectó .venv/Scripts/python.exe. Usando ejecutable del sistema.")
    return sys.executable

async def read_until_prompt(proc):
    """
    Lee la salida del subproceso de forma robusta, detectando el prompt '>' 
    incluso si hay variaciones en los espacios en blanco.
    """
    buffer = bytearray()
    try:
        while True:
            chunk = await asyncio.wait_for(proc.stdout.read(1024), timeout=180.0)
            if not chunk:
                break
            
            buffer.extend(chunk)
            
            # Diagnóstico en terminal
            text_so_far = buffer.decode('utf-8', errors='replace')
            print(chunk.decode('utf-8', errors='replace'), end="", flush=True)
            
            # Buscamos el prompt de forma más flexible
            # El prompt estándar es "> ", pero chequeamos los últimos caracteres limpios
            if text_so_far.strip().endswith(">"):
                break
                
    except asyncio.TimeoutError:
        logger.error("Timeout esperando respuesta del agente.")
    except Exception as e:
        logger.error(f"Error de lectura: {e}")
            
    full_output = buffer.decode('utf-8', errors='replace')
    
    # Limpiar el prompt del final de la respuesta de forma segura
    clean_output = full_output.strip()
    if clean_output.endswith(">"):
        clean_output = clean_output[:-1].strip()
        
    return clean_output

@app.on_event("startup")
async def startup_event():
    global process
    
    script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "AgenteRagRobos.py")
    cwd = os.path.dirname(script_path)
    python_exe = get_python_executable()
    
    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"
    
    logger.info(f"Lanzando AgenteRagRobos.py desde {cwd}")
    
    try:
        process = await asyncio.create_subprocess_exec(
            python_exe, script_path,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT, # Redirigimos errores a stdout para leerlos
            env=env,
            cwd=cwd
        )
        
        logger.info("Agente lanzado. Esperando prompt inicial...")
        # Esto leerá los mensajes de carga de Chroma/Ollama
        init_output = await read_until_prompt(process)
        logger.info("Prompt inicial detectado. Agente listo.")
        
    except Exception as e:
        logger.error(f"No se pudo iniciar el subproceso: {e}")
        process = None # Aseguramos que no quede un objeto roto

@app.on_event("shutdown")
async def shutdown_event():
    global process
    if process:
        logger.info("Cerrando subproceso del agente...")
        try:
            process.stdin.write(b"salir\n")
            await process.stdin.drain()
            await asyncio.wait_for(process.wait(), timeout=5.0)
        except:
            process.kill()

@app.get("/")
async def root():
    return FileResponse(os.path.join(static_dir, "index.html"))

@app.post("/api/chat")
async def chat(request: ChatRequest):
    global process
    
    if not process or process.returncode is not None:
        raise HTTPException(status_code=500, detail="Agente no disponible.")
    
    msg = request.message.strip()
    if not msg:
        return {"response": ""}
          
    try:
        # 1. LIMPIEZA DE BUFFER: Leemos cualquier residuo antes de mandar la orden
        try:
            while True:
                # Intento de lectura no bloqueante para vaciar restos
                await asyncio.wait_for(process.stdout.read(1024), timeout=0.1)
        except asyncio.TimeoutError:
            pass # Buffer vacío, perfecto

        # 2. ENVIAR ORDEN
        logger.info(f"Enviando: '{msg}'")
        process.stdin.write((msg + "\n").encode('utf-8'))
        await process.stdin.drain()
        
        # 3. LEER RESPUESTA REAL
        response = await read_until_prompt(process)
        return {"response": response}
        
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
