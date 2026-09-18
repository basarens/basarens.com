from flask import Flask, render_template

app = Flask(__name__)

# Route definitions
@app.route("/")
def start():
    return render_template("start.html")

@app.route("/menu")
def menu():
    return render_template("menu.html")

@app.route("/intro")
def intro():
    return render_template("intro.html")

@app.route("/credits")
def credits():
    return render_template("credits.html")

@app.route("/dedicatedto")
def dedicatedto():
    return render_template("dedicatedto.html")

@app.route("/task1")
def task1():
    return render_template("task1.html")

@app.route("/dialogue1")
def dialogue1():
    return render_template("dialogue1.html")

@app.route("/task2")
def task2():
    return render_template("task2.html")

@app.route("/task3")
def task3():
    return render_template("task3.html")

@app.route("/dialogue2")
def dialogue2():
    return render_template("dialogue2.html")

@app.route("/task4")
def task4():
    return render_template("task4.html")

@app.route("/dialogue3")
def dialogue3():
    return render_template("dialogue3.html")

@app.route("/task5")
def task5():
    return render_template("task5.html")

@app.route("/retry")
def retry():
    return render_template("retry.html")

@app.route('/dialogue4')
def dialogue4():
    return render_template('dialogue4.html')

if __name__ == "__main__":
    app.run(debug=True)
