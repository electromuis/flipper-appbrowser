FROM nikolaik/python-nodejs:latest

# Install nodejs cli utils
RUN npm install -g nodemon concurrently

# Install ufbt
RUN apt update && apt install git cron
RUN git clone https://github.com/flipperdevices/flipperzero-ufbt /opt/ufbt
RUN /opt/ufbt/ufbt update
578 20
/Cron task to search apps-\RUN crontab -l | { cat; echo "*/2 * * * * python /app/backend/search.py"; } | crontab -

# Install backend
ADD backend /app/backend
WORKDIR /app/backend
RUN pip install -r requirements.txt

# Install frontend
ADD frontend /app/frontend
WORKDIR /app/frontend
RUN NODE_ENV=development npm i

WORKDIR /app
ENTRYPOINT [ "concurrently", "cd /app/backend && flask db upgrade && nodemon app.py", "cd /app/frontend && npm run watch", "cron" ]