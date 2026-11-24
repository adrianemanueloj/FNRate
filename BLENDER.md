# Making the FNRate character in Blender

The site shows a 3D character on every profile. Right now it's a simple placeholder.
You can swap it for your own model from Blender. The site finds parts of your model
by **name**, so as long as you name things like this, all the options keep working.

Keep the character original (your own design, not a real Fortnite skin).

## 1. Name the parts (Outliner, double-tap a name to rename)

| Name the object | It shows when |
| --- | --- |
| `Body_M` | Body is set to Male |
| `Body_F` | Body is set to Female |
| `Mask` | Mask is On |
| `Hair_Up` | Hair is Up |
| `Hair_Down` | Hair is Down |
| `Cape` | Cape is On |

Everything else (head, hands, boots, logo...) is always shown.
You can split a part into pieces: `Hair_Up.001`, `Hair_Up_bun` and so on all count as `Hair_Up`.
A parent object or empty with one of these names hides or shows everything under it.

## 2. Name the materials (Material tab)

| Material name | Recolored by |
| --- | --- |
| `Suit` | Suit color |
| `Accent` | Mask, gloves and boots color |
| `Hair` | Hair color |
| `Skin` | Skin tone |

Make these materials white or light grey in Blender so the picked colors look right.
Any other material keeps the color you gave it.

## 3. Pose and export

- Stand the character upright, facing **-Y** in Blender (the front view, numpad 1, should show its face).
- Size doesn't matter, the site scales it.
- Keep it light: under about 20,000 triangles and a few MB, so it loads fast on phones.
- File > Export > **glTF 2.0**, Format: **glTF Binary (.glb)**. Tick "Apply Modifiers".

## 4. Test it

Open the design preview, go to a profile, tap **Customize character**, and pick your
`.glb` under "Test your own Blender model". When you're happy, send the file and it
goes into the site.
