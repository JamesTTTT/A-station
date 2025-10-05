FROM python:3.12-slim
WORKDIR /app

# Install system dependencies including netcat
RUN apt-get update && apt-get install -y \
    openssh-client \
    sshpass \
    git \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY . .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /app/AStationRest

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]