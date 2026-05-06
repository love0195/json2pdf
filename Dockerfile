FROM python:3.9-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

COPY frontend/package*.json frontend/
RUN apt-get update && apt-get install -y nodejs npm && \
    cd frontend && npm install && npm run build

EXPOSE 5000

CMD ["python", "app.py"]
