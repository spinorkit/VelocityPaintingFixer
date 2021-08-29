# Velocity painting post-processor

Work in progress! Only tested (a little) on Windows!
Only paints on outer perimeters and if the Y value is > 100 mm to restrict painting to one side only.
Speeds for unpainted moves (e.g. inner perimeters, infill) are left as specified in the orginal Simplify3D gcode output.
Defaults setup for Simplify3D gcode with :
Default Printing Speed: 3000 mm/min
Outline Underspeed: 50%

VelocityPainting Target speed: 1500 mm.min
