
import { CloudMusic } from './lib/addon/CloudMusic.js';

console.log(CloudMusic.getSecData([28578755],"5feee63aa3b894d7db1f0ec0b5067ce1"));

CloudMusic.getURL([28578755])
    .then(data => {
        console.log(data);
    });