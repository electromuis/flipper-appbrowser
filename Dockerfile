FROM nikolaik/python-nodejs:latest

RUN npm install -g nodemon
RUN pip install flask octokit

WORKDIR /app

ADD src src
ADD public public
COPY package.json .
COPY *.js /app/
COPY index.py .

RUN npm install

ENTRYPOINT [ "/bin/sh", "-c" , "npm run watch & nodemon index.py" ]