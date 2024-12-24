from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
import uvicorn
import os

app = FastAPI()

@app.get("/books")
async def serve_book_text(book_name: str):
    file_path = f"./books/{book_name}.txt"
    return FileResponse(file_path)


@app.get("/book_cover")
async def server_book_cover_img(book_name: str) -> FileResponse:
    file_path = f"./book_covers/{book_name}.png"
    if os.path.exists(file_path):
        return FileResponse(file_path)
    else:
        # TODO: Handle 404
        return JSONResponse({"error": "Book cover not found!"}, status_code=404)


@app.get("/api/v1/list_books")
async def get_list_of_books():
    files = os.listdir("./books")
    data = [file.replace(".txt", "") for file in files if file.endswith(".txt")]
    return JSONResponse(data)



@app.get("/{path:path}")
async def serve_static(path: str):
    if path == "":
        path = "index.html"
    
    return FileResponse(path)


port = 8000
uvicorn.run(app, host="127.0.0.1", port=port)