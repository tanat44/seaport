# Seaport Simulator

Web based seaport simulator (container terminal simulator). This code is written to explore the possibility of running event simulation with visualization solely on the browser. To answer that question, operation of the seaport is chosen because of the complicate handover process (tasks dependencies) and emulations of multiple kind of equipment is a given. 

[Click here to try it yourself!](https://tanat44.github.io/seaport/)

*Latest update to main branch will automatically be deployed

![Seaport 2024-10-12](/doc/241012.png)

## Key components

1. 3D visualization is realized using Three.Js library. Rendering framerate is synchronize with the physics (kinematic) emulation. Together with speeding factor (emulation speed can be set to multiples of realtime), it's possible to realize simulation at, for example, 0.5x / 2x / 100x of realtime speed
1. Quay crane (QC) emulation: Emulation covers 3 axis of motions: gantry, trolley, spreader (hoist). QC will position itself according to local coordinate target specified in move command.
1. Truck emulation: Path planning are done online as and when needed. The core path finding algorithm is based on standard A-star algorithm. Then, the solution is smoothing and simplify to get the minimum control points which provide collision free solution. The control points are then convert to bezier curve. This path represents trajectory of the trailer. Kinematic chain of the tractor is resolved to draw path of the tractor. The tractor and trailer are combined into truck.
1. Rubber tire gantry (RTG) emulation: This emulation is very similar to QC.
1. QC / Truck / RTG manager manages each respective equipment. Provide the mechanism to allocate an equipment to JobSequence based on control from the upper system.
1. Storage block uses to represent a group of storage in both vessel and yard blocks.
1. Job

## Job concept
1. Job defines a logical operation of a specific equipment in the system. For example there are job definitions for QC for:
  1. Move to pick container at the vessel
  1. Move container to unload at location under QC
1. JobSequence defines the order of the process of a given sequence (e.g. container unload operation from vessel to yard). JobSequence contains ordered Jobs and the dependencies between Jobs, if any.
1. JobRunner takes all sequences and execute them in order. JobRunner reacts to state change of the system and find the next dependencies resolved job and tell the job corresponding equipment to execute.

## Layout
Building a layout designing tool is time consuming and it would deviate the project from focusing on event based simulation. That's the reason why the current solution adopted for annotated (object with naming convention) SVG created by external editor.

This is an example of SVG create and edited using Inkscape (Vector graphic software).

![Layout editing using Inkscape](/doc/layout-inkscape.png)