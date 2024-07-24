from tkinter import ttk, Tk, StringVar
import subprocess

root = Tk()
root.eval('tk::PlaceWindow . center')
root.title("nTracer2")
frm = ttk.Frame(root, padding=50)
frm.grid()
ttk.Label(frm, text="Welcome to nTracer 2!",  font=("Helvetica", 20)).grid(column=0, row=0, pady=(0, 10))
ttk.Label(frm, text="Select dataset to view").grid(column=0, row=1)

variable = StringVar(root)
variable.set("brainbow_test")
option_menu = ttk.OptionMenu(frm, variable, "brainbow_test", "brainbow_test", "182725")
option_menu.grid(column=0, row=3, pady=(2, 0))
option_menu.config(width=10)

def submit():
    selected_dataset = variable.get()
    print(selected_dataset)
    root.destroy()


ttk.Button(frm, text="Continue", command=submit).grid(column=0, row=4, pady=(20, 0))
root.mainloop()

subprocess.check_output("", shell=True)