FROM python:3.9

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
  pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY . .

ENV PORT=9000

EXPOSE 9000

CMD ["sh", "-lc", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --reload"]

