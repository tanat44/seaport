import { Terminal } from "./Terminal/Terminal";
import { Visualizer } from "./Visualizer/Manager";

const visualizer = new Visualizer();
const terminal = new Terminal(visualizer);
