print("hello")

# import numpy as np
# import matplotlib.pyplot as plt


# n = int(10)

# r1 = np.random.rand(n)
# r2 = np.random.rand(n)

# theta = np.arccos(1-2*r1)
# phi = 2*np.pi*r2
# r = 1

# dx = r*np.sin(theta)*np.cos(phi)
# dy = r*np.sin(theta)*np.sin(phi)
# dz = r*np.cos(theta)

# x = np.hstack((0, np.cumsum(dx)))
# y = np.hstack((0, np.cumsum(dy)))
# z = np.hstack((0, np.cumsum(dz)))

# print(x)

# # 1. Create a Figure
# fig = plt.figure(figsize=(8, 6))

# # 2. Add 3D Axes
# ax = fig.add_subplot(111, projection='3d')

# # 4. Plot the Data (Line Plot)
# ax.plot(x, y, z, label='Photon Path')

# # 5. Customize
# ax.set_title("tinyMC")
# ax.set_xlabel("X Position")
# ax.set_ylabel("Y Position")
# ax.set_zlabel("Z Position")
# ax.legend() # Show the label

# fig.savefig("tinyMC.pdf")