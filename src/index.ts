import { Terminal } from "./Terminal/Terminal";
import { Visualizer } from "./Visualizer/Visualizer";
import "./main.css";

const visualizer = new Visualizer();
const terminal = new Terminal(visualizer);
