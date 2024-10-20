import { Terminal } from "./Terminal/Terminal";
import { Visualizer } from "./Visualizer/Visualizer";
import "./main.css";
import { Mode } from "./types";

const visualizer = new Visualizer();
const search = window.location.search.replace("?", "");
let mode = Mode.Terminal;
if (search === "traffic") {
  mode = Mode.Traffic;
} else {
  const terminal = new Terminal(visualizer);
}
console.log("Mode:", mode);
