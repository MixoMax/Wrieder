from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

app = FastAPI()

@app.get("/books")
async def serve_book_text(book_name: str):
    file_path = f"./books/{book_name}.txt"
    return FileResponse(file_path)

@app.get("/{path:path}")
async def serve_static(path: str):
    if path == "":
        path = "index.html"
    
    return FileResponse(path)


port = 8000
uvicorn.run(app, host="127.0.0.1", port=port)