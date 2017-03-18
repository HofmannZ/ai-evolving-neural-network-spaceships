class Coordinate {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class DNA {
  constructor(dna) {
    if (dna) {
      this.genes = [...dna.genes];
    } else {
      this.genes = [];

      for (let i = 0; i < 25; i++) {
        this.genes.push(Math.random());
      }
    }
  }
}

class NeuralNetwork {
  constructor(dna) {
    // Setup the layers of neurons.
    const inputLayer = new synaptic.Layer(3);
    const hiddenLayer = new synaptic.Layer(5);
    const outputLayer = new synaptic.Layer(2);

    // Connect the layers to each other.
    inputLayer.project(hiddenLayer);
    hiddenLayer.project(outputLayer);

    // Setup the network with random weigths and an all to all connection;
    this.network = new synaptic.Network({
      input: inputLayer,
      hidden: [hiddenLayer],
      output: outputLayer
    });

    // Set the weigths based on the DNA.
    const inputConections = this.network.layers.input.connectedTo[0].connections;
    const hiddenConections = this.network.layers.hidden[0].connectedTo[0].connections;
    let i = 0;

    Object.keys(inputConections).forEach((connection) => {
      inputConections[connection].weight = dna[i];
      i++;
    });
    Object.keys(hiddenConections).forEach((connection) => {
      hiddenConections[connection].weight = dna[i];
      i++
    });
  }
}

class Sensor {
  constructor(angle) {
    this.angle = angle;
  }
}

class Engine {
  constructor() {
    this.thrust = 0;
  }

  setThrust(thrust) {
    this.thrust = thrust;
  }
}

class Spaceship {
  constructor(x, y, size, dna, angle = 0, speed = 0, acceleration = 0) {
    // The position of the spaceship in space.
    this.position = new Coordinate(x, y);

    // The size of the spaceship.
    this.size = size;

    // The dna of this particular spaceship.
    this.dna = dna ? new DNA(dna) : new DNA();

    // The neural network conrolling the spaceship.
    this.neuralNetwork = new NeuralNetwork(this.dna);

    // The angle ralative to the vector (0, 0), (0, 1).
    this.angle = angle;

    // The speed and acceleration of the spaceship.
    this.speed = speed;
    this.acceleration = acceleration;

    // The two engines that will move the spaceship.
    this.leftEngine = new Engine();
    this.rightEngine = new Engine();

    // The three sensors the scan the spaceship's enviorment at a certain angle.
    this.leftSensor = new Sensor(-45);
    this.centerSensor = new Sensor(0);
    this.rightSensor = new Sensor(45);

    // The progress of the spaceship.
    this.timeLived = 0;
    this.crashed = false;
    this.completed = false;

    // The DOM element of the spaceship.
    this.element = document.createElement('img');
    this.element.src = `assets/${this.getAsset()}`;
    this.element.classList.add('spaceship');

    // Apply the size to the element.
    const { width, height, transformOrigin, offset } = this.getDimensions();
    this.element.style.width = `${width.toString()}px`;
    this.element.style.height = `${height.toString()}px`;

    // Apply the offset and angle to the element.
    this.element.style.transformOrigin = `center ${transformOrigin.toString()}px`;
    this.element.style.transform = `translate(-50%, 100%) rotate(${this.angle}deg)`;

    // Apply the initial position to the element.
    this.element.style.left = `${this.position.x.toString()}px`;
    this.element.style.bottom = `${this.position.y.toString()}px`;
  }

  getDimensions() {
    const dimensions = {
      width: this.size * 4,
      transformOrigin: this.size * 3.5,
    };

    if (this.leftEngine.thrust > 0 || this.rightEngine.thrust > 0) {
      dimensions.height = this.size * 6;
      dimensions.offset = this.size * 2.5;
    } else {
      dimensions.height = this.size * 5;
      dimensions.offset = this.size * 1.5;
    }

    return dimensions;
  }

  getAsset() {
    if (this.leftEngine.thrust > 0 && this.rightEngine.thrust > 0) {
      return 'spaceship-both.svg';
    } else if (this.leftEngine.thrust > 0 && this.rightEngine.thrust === 0) {
      return 'spaceship-left.svg';
    } else if (this.leftEngine.thrust === 0 && this.rightEngine.thrust > 0) {
      return 'spaceship-right.svg';
    } else {
      return 'spaceship.svg';
    }
  }

  propel() {
    // Get the engine thrusts from the neural network based on the sensor input.
    const [leftThrust, rightThrust] = this.neuralNetwork.network.activate([0, 1, 0]);

    // Set the engine thrusts based on the neural network output.
    this.leftEngine.setThrust(leftThrust);
    this.rightEngine.setThrust(rightThrust);

    // Carculate new angle that the spaceship will be facing.
    const maximumAdjustment = 16;
    const leftEngineAdjustment = maximumAdjustment * this.leftEngine.thrust;
    const rightEngineAdjustment = -1 * maximumAdjustment * this.rightEngine.thrust;
    this.angle = this.angle + (leftEngineAdjustment + rightEngineAdjustment);

    // Calculate the acceleration of the spaceship.
    this.acceleration = this.leftEngine.thrust + this.rightEngine.thrust;

    // Calculate the speed of the spaceship.
    this.speed += this.acceleration;

    // Calculate the position of the spaceship.
    const x = this.position.x + Math.sin(Math.PI / 180 * this.angle) * this.speed;
    const y = this.position.y + Math.cos(Math.PI / 180 * this.angle) * this.speed;
    this.position = new Coordinate(x, y);

    // Set the right asset for the element.
    this.element.src = `assets/${this.getAsset()}`;

    // Apply the (possibly) new size to the element.
    const { width, height, transformOrigin, offset } = this.getDimensions();
    this.element.style.width = `${width.toString()}px`;
    this.element.style.height = `${height.toString()}px`;

    // Apply the new offset and angle to the element.
    this.element.style.transformOrigin = `center ${transformOrigin.toString()}px`;
    this.element.style.transform = `translate(-50%, 100%) rotate(${this.angle}deg)`;

    // Apply the new position to the element.
    this.element.style.left = `${this.position.x.toString()}px`;
    this.element.style.bottom = `${this.position.y.toString()}px`;
  }

  render() {
    space.appendChild(this.element);
  }
}

class Population {
  constructor() {

  }
}

class Astroid {
  constructor() {

  }
}

class Planet {
  constructor() {

  }
}

class Mission {
  constructor() {

  }
}

const space = document.querySelector('.space');
const spaceship = new Spaceship(100, 100, 4);
spaceship.render();


setInterval(() => {
  spaceship.propel();
}, 128);
