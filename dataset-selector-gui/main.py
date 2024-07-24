from tkinter import ttk, Tk, StringVar

root = Tk()
root.eval('tk::PlaceWindow . center')
frm = ttk.Frame(root, padding=50)
frm.grid()
ttk.Label(frm, text="Welcome to nTracer 2!").grid(column=0, row=0)
ttk.Label(frm, text="Select dataset to view").grid(column=0, row=1)

variable = StringVar(root)
variable.set("brainbow_test")
ttk.OptionMenu(frm, variable, "brainbow_test", "brainbow_test", "182725").grid(column=0, row=3)

def submit():
    selected_dataset = variable.get()
    print(selected_dataset)
    root.destroy()


ttk.Button(frm, text="Submit", command=submit).grid(column=0, row=4)
root.mainloop()
