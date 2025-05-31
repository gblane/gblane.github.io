import numpy as np
import matplotlib.pyplot as plt

from pyscript import display, document, when

# Giles Blaney, PhD Summer 2025

print("ready")

# The @when decorator links the "click" event on the element with the ID "calculate-button"
# to the function defined immediately below it.
@when("click", selector="#calculate-button")
def tinyMC():
    
    input_element = document.getElementById("number-input")
    
    n = int(input_element.value)
    
    print("running MC ...")
    
    output_element = document.getElementById("output")
    output_element.innerText = f"{n} steps will be run"
    
    r1 = np.random.rand(n)
    r2 = np.random.rand(n)
    
    theta = np.arccos(1-2*r1)
    phi = 2*np.pi*r2
    r = 1
    
    dx = r*np.sin(theta)*np.cos(phi)
    dy = r*np.sin(theta)*np.sin(phi)
    dz = r*np.cos(theta)
    
    x = np.hstack((0, np.cumsum(dx)))
    y = np.hstack((0, np.cumsum(dy)))
    z = np.hstack((0, np.cumsum(dz)))
    
    
    
    fig = plt.figure(figsize=(8, 6))
    
    # ax = fig.add_subplot(111, projection='3d')
    ax = fig.add_subplot(111)
    
    # ax.plot(x, y, z, label='Path')
    ax.plot(x, y, label='Path')
    
    ax.set_title("tinyMC")
    ax.set_xlabel("X Position")
    ax.set_ylabel("Y Position")
    # ax.set_zlabel("Z Position")
    ax.legend() 
    
    display(fig, target="plot")
    
    print("done")