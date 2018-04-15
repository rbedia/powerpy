FROM tiangolo/uwsgi-nginx:python3.6

COPY requirements.txt /app/requirements.txt

RUN pip install -r requirements.txt

COPY . /app

RUN /app/build-powerlines.py

