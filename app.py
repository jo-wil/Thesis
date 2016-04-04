from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello_world():
    f = open('index.html')
    html = f.read()
    f.close()
    return html

if __name__ == '__main__':
    app.run(port=8000)
