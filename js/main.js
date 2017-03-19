class Coordinate {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class DNA {
  constructor(genes) {
    if (genes) {
      this.genes = [...genes];
    } else {
      this.genes = [];

      for (let i = 0; i < 72; i++) {
        this.genes.push(Math.random());
      }
    }
  }

  crossover(partner) {
    const childGenesOne = [];
    const childGenesTwo = [];

    for (let i = 0; i < this.genes.length; i++) {
      if (Math.random() < mission.crossoverProbability) {
        childGenesOne.push(this.genes[i]);
        childGenesTwo.push(partner.genes[i]);
      } else {
        childGenesTwo.push(this.genes[i]);
        childGenesOne.push(partner.genes[i]);
      }
    }

    return [new DNA(childGenesOne), new DNA(childGenesTwo)];
  }

  mutate() {
    for (let i = 0; i < this.genes.length; i++) {
      if (Math.random() < mission.mutationProbability) {
        this.genes[i] = Math.random();
      }
    }
  }
}

class NeuralNetwork {
  constructor(dna) {
    // Setup the layers of neurons.
    const inputLayer = new synaptic.Layer(4);
    const hiddenLayerOne = new synaptic.Layer(8);
    const hiddenLayerTwo = new synaptic.Layer(4);
    const outputLayer = new synaptic.Layer(2);

    // Connect the layers to each other.
    inputLayer.project(hiddenLayerOne);
    hiddenLayerOne.project(hiddenLayerTwo);
    hiddenLayerTwo.project(outputLayer);

    // Setup the network with random weigths and an all to all connection;
    this.network = new synaptic.Network({
      input: inputLayer,
      hidden: [
        hiddenLayerOne,
        hiddenLayerTwo,
      ],
      output: outputLayer,
    });

    // Set the weigths based on the DNA.
    const inputConections = this.network.layers.input.connectedTo[0].connections;
    const hiddenConectionsOne = this.network.layers.hidden[0].connectedTo[0].connections;
    const hiddenConectionsTwo = this.network.layers.hidden[1].connectedTo[0].connections;
    let i = 0;

    console.log(Object.keys(inputConections).length + Object.keys(hiddenConectionsOne).length + Object.keys(hiddenConectionsTwo).length);

    Object.keys(inputConections).forEach((connection) => {
      inputConections[connection].weight = dna.genes[i];
      i++;
    });
    Object.keys(hiddenConectionsOne).forEach((connection) => {
      hiddenConectionsOne[connection].weight = dna.genes[i];
      i++
    });
    Object.keys(hiddenConectionsTwo).forEach((connection) => {
      hiddenConectionsTwo[connection].weight = dna.genes[i];
      i++
    });
  }
}

class Sensor {
  constructor(angle, range = 1024) {
    this.angle = angle;
    this.range = range;
  }

  read(position, angle) {
    const totalAngle = this.angle + angle;

    for (let i = 0; i < this.range; i += 8) {
      const x = position.x + Math.sin(Math.PI / 180 * totalAngle) * i;
      const y = position.y + Math.cos(Math.PI / 180 * totalAngle) * i;

      for (let i = 0; i < mission.asteroids.length; i++) {
        if (x > mission.asteroids[i].position.x - mission.asteroids[i].width / 2
            && x < mission.asteroids[i].position.x + mission.asteroids[i].width / 2
            && y > mission.asteroids[i].position.y - mission.asteroids[i].height / 2
            && y < mission.asteroids[i].position.y + mission.asteroids[i].height / 2
        ) {

          let xOffset = mission.asteroids[i].position.x - x;
          if (xOffset < 0) {
            xOffset *= -1;
          }

          let yOffset = mission.asteroids[i].position.y - y;
          if (yOffset < 0) {
            yOffset *= -1;
          }

          // Calculate the distance based on the Pythagorean theorem.
          let currentOffset = Math.sqrt(Math.pow(xOffset, 2) + Math.pow(yOffset, 2));

          return currentOffset / this.range;
        }
      }
    }
    return 1;
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
  constructor(id, x, y, dna, size = 4, angle = 0) {
    // The ID of the spaceship.
    this.id = id;

    // The position of the spaceship in space.
    this.position = new Coordinate(x, y);

    // The size of the spaceship.
    this.size = size;

    // The dna of this particular spaceship.
    this.dna = dna ? new DNA(dna.genes) : new DNA();

    // The neural network conrolling the spaceship.
    this.neuralNetwork = new NeuralNetwork(this.dna);

    // The angle ralative to the vector (0, 0), (0, 1).
    this.angle = angle;

    // The speed and acceleration of the spaceship.
    this.speed = 0;
    this.acceleration = 0;

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
    this.element.src = `assets/${'spaceship-both.svg'}`;
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

    // Binding the context to the mothods.
    this.propel = this.propel.bind(this);
  }

  getDimensions() {
    const dimensions = {
      width: this.size * 4,
      transformOrigin: this.size * 3.5,
    };

    // if (this.leftEngine.thrust > 0 || this.rightEngine.thrust > 0) {
    //   dimensions.height = this.size * 6;
    //   dimensions.offset = this.size * 2.5;
    // } else {
    //   dimensions.height = this.size * 5;
    //   dimensions.offset = this.size * 1.5;
    // }

    dimensions.height = this.size * 6;
    dimensions.offset = this.size * 2.5;

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
    if (!this.crashed && !this.completed) {
      // Read sensor data.
      const leftSensorData = this.leftSensor.read(this.position, this.angle);
      const centerSensorData = this.centerSensor.read(this.position, this.angle);
      const rightSensorData = this.rightSensor.read(this.position, this.angle);

      let xOffset = mission.target.position.x - this.position.x;
      if (xOffset < 0) {
        xOffset *= -1;
      }

      let yOffset = mission.target.position.y - this.position.y;
      if (yOffset < 0) {
        yOffset *= -1;
      }

      // Calculate the distance to taget based on the Pythagorean theorem.
      let currentOffset = Math.sqrt(Math.pow(xOffset, 2) + Math.pow(yOffset, 2));

      // Get the engine thrusts from the neural network based on the sensor input.
      const [leftThrust, rightThrust] = this.neuralNetwork.network.activate([
        1 / currentOffset,
        leftSensorData,
        centerSensorData,
        rightSensorData,
      ]);

      // Set the engine thrusts based on the neural network output.
      this.leftEngine.setThrust(leftThrust);
      this.rightEngine.setThrust(rightThrust);

      // Carculate new angle that the spaceship will be facing.
      const maximumAdjustment = 16;
      const leftEngineAdjustment = maximumAdjustment * this.leftEngine.thrust;
      const rightEngineAdjustment = -1 * maximumAdjustment * this.rightEngine.thrust;
      this.angle += leftEngineAdjustment + rightEngineAdjustment;

      // Calculate the acceleration of the spaceship.
      this.acceleration = this.leftEngine.thrust + this.rightEngine.thrust;

      // Calculate the speed of the spaceship.
      this.speed += this.acceleration;

      // Calculate the position of the spaceship.
      const x = this.position.x + Math.sin(Math.PI / 180 * this.angle) * this.speed;
      const y = this.position.y + Math.cos(Math.PI / 180 * this.angle) * this.speed;
      this.position = new Coordinate(x, y);

      // // Set the right asset for the element.
      // this.element.src = `assets/${this.getAsset()}`;

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

      // Check if a colission with an astroid has ocured.
      for (let i = 0; i < mission.asteroids.length; i++) {
        if (this.position.x > mission.asteroids[i].position.x - mission.asteroids[i].width / 2
            && this.position.x < mission.asteroids[i].position.x + mission.asteroids[i].width / 2
            && this.position.y > mission.asteroids[i].position.y - mission.asteroids[i].height / 2
            && this.position.y < mission.asteroids[i].position.y + mission.asteroids[i].height / 2
        ) {
          this.crashed = true;
          this.timeLived = mission.count;
        }
      }

      // Check if the target has been reached.
      if (this.position.x > mission.target.position.x - mission.target.width / 2
          && this.position.x < mission.target.position.x + mission.target.width / 2
          && this.position.y > mission.target.position.y - mission.target.height / 2
          && this.position.y < mission.target.position.y + mission.target.height / 2
      ) {
        this.completed = true;
        this.timeLived = mission.count;
      }
    }
  }

  calculateFitness() {
    // Calculate the fitness of the spaceship.
    let xOffset = mission.target.position.x - this.position.x;
    if (xOffset < 0) {
      xOffset *= -1;
    }

    let yOffset = mission.target.position.y - this.position.y;
    if (yOffset < 0) {
      yOffset *= -1;
    }

    // Calculate the distance based on the Pythagorean theorem.
    let currentOffset = Math.sqrt(Math.pow(xOffset, 2) + Math.pow(yOffset, 2));

    // Set high fitness when distance is low, and low fitness when distance is hight.
    this.fitness = 1 / currentOffset;

    // Adjust the spaceship's fitness based on how well it's completed the mission.
    if (this.crashed) {
      this.fitness /= (1 / this.timeLived) * mission.lifeSpan;
    }

    if (this.completed) {
      this.fitness *= (1 / this.timeLived) * mission.lifeSpan;
    }
  }

  render() {
    space.appendChild(this.element);
  }
}

class Population {
  constructor(populationSize) {
    this.populationSize = populationSize;
    this.spaceships = [];

    // Set the default values.
    this.averageFitness = 0;
    this.mutationProbability = 0;
    this.maxFitness = 0;

    for (let i = 0; i < this.populationSize; i++) {
      this.spaceships[i] = new Spaceship(
        i,
        mission.startingPosition.x,
        mission.startingPosition.y
      );
    }

    this.fitestSpaceship = this.spaceships[0];
  }

  completed() {
    for (let i = 0; i < this.populationSize; i++) {
      if (!this.spaceships[i].completed) {
        return false;
      }
    }
    return true;
  }

  propel() {
    for (let i = 0; i < this.populationSize; i++) {
      this.spaceships[i].propel();
    }
  }

  evaluate() {
    let i;
    let totalFitness = 0;
    this.maxFitness = 0;

    // Evaluate the fitness of each spaceship in the population.
    for (i = 0; i < this.populationSize; i++) {
      this.spaceships[i].calculateFitness();

      if (this.spaceships[i].fitness > this.maxFitness) {
        this.maxFitness = this.spaceships[i].fitness;
        this.fitestSpaceship = this.spaceships[i];
      }

      totalFitness += this.spaceships[i].fitness;
    }

    // The average fitness from 0 to 1.
    this.averageFitness = totalFitness / this.populationSize;

    for (i = 0; i < this.populationSize; i++) {
      // Level the spaceship's fitness to a 0 to 100 scale based on the maximun fitness of the population.
      this.spaceships[i].fitness /= this.maxFitness;
      this.spaceships[i].fitness *= 100;
    }

    this.mutationProbability = (1 / (this.averageFitness / this.maxFitness * 100));
  }

  pickParrent(i) {
    const parrentIndex = Math.floor(Math.random() * this.populationSize);
    const parrent = this.spaceships[parrentIndex];

    // Avoid callstack limit error.
    if (i > Math.pow(2, 14) / 2) {
      return parrent;
    }

    // Check if parrent is suitable based on the probebility of it's fitness.
    if ((Math.random() * 100) < parrent.fitness) {
      return parrent;
    }

    // Else try to find an other parrent.
    return this.pickParrent(++i);
  }

  crossover() {
    const evolvedSpaceships = [];

    this.evaluate();

    for (let i = 0; i < this.populationSize; i += 2) {
      // Select two random parrents.
      let parrentOne = this.pickParrent(0);
      let parrentTwo = this.pickParrent(0);

      if (parrentOne.id === parrentTwo.id) {
        parrentTwo = this.pickParrent(0);
      }

      let childrenDna;

      // Crossover the dna form the strongest to the weakest parerent.
      if (parrentOne.fitness >= parrentTwo.fitness) {
        childrenDna = parrentOne.dna.crossover(parrentTwo.dna);
      } else {
        childrenDna = parrentTwo.dna.crossover(parrentOne.dna);
      }

      evolvedSpaceships[i] = new Spaceship(
        i,
        mission.startingPosition.x,
        mission.startingPosition.y,
        childrenDna[0]
      );
      evolvedSpaceships[i + 1] = new Spaceship(
        i,
        mission.startingPosition.x,
        mission.startingPosition.y,
        childrenDna[1]
      );

      // Mutate the new child based on the mutation probability.
      evolvedSpaceships[i].dna.mutate(this.mutationProbability);
    }

    // Ensure that the best spaceship returns to the new population.
    evolvedSpaceships[0] = new Spaceship(
      0,
      mission.startingPosition.x,
      mission.startingPosition.y,
      new DNA(this.fitestSpaceship.dna.genes)
    );

    this.spaceships = evolvedSpaceships;
  }

  render() {
    for (let i = 0; i < this.populationSize; i++) {
      this.spaceships[i].render();
    }
  }
}

class Planet {
  constructor(x, y, asset = 'planet.svg', size = 32) {
    // The position of the planet in space.
    this.position = new Coordinate(x, y);

    // The size op the plannet;
    this.width = size;
    this.height = size;

    this.asset = asset;

    // Create the plannet element.
    this.element = document.createElement('img');
    this.element.src = `assets/${this.asset}`;
    this.element.classList.add('planet');

    // Set the correct plannet size.
    this.element.style.width = `${this.width.toString()}px`;
    this.element.style.height = `${this.height.toString()}px`;

    // Set the correct plannet position.
    this.element.style.left = `${this.position.x.toString()}px`;
    this.element.style.bottom = `${this.position.y.toString()}px`;
  }

  render() {
    // Add the plannet to the DOM.
    space.appendChild(this.element);
  }
}

class HUD {
  render() {
    const hud = document.createElement('article');
    hud.classList.add('hud');

    if (mission.completed) {
      const completed = document.createElement('p');
      completed.classList.add('hud__item');
      completed.classList.add('hud__item_complete');
      completed.innerHTML = `Mission complete!`;
      hud.appendChild(completed);
    }

    const lifeSpan = document.createElement('p');
    lifeSpan.classList.add('hud__item');
    lifeSpan.innerHTML = `Life span: ${mission.lifeSpan}`;
    hud.appendChild(lifeSpan);

    const populationCount = document.createElement('p');
    populationCount.classList.add('hud__item');
    populationCount.innerHTML = `Generation: ${mission.populationCount}`;
    hud.appendChild(populationCount);

    const averageFitness = document.createElement('p');
    averageFitness.classList.add('hud__item');
    averageFitness.innerHTML = `Average fitness: ${(mission.population.averageFitness * 100).toFixed(3)}`;
    hud.appendChild(averageFitness);

    const maxFitness = document.createElement('p');
    maxFitness.classList.add('hud__item');
    maxFitness.innerHTML = `Current highest fitness: ${(mission.population.maxFitness * 100).toFixed(3)}`;
    hud.appendChild(maxFitness);

    const populationSize = document.createElement('p');
    populationSize.classList.add('hud__item');
    populationSize.innerHTML = `Population size: ${mission.populationSize} spaceships`;
    hud.appendChild(populationSize);

    const crossoverProbability = document.createElement('p');
    crossoverProbability.classList.add('hud__item');
    crossoverProbability.innerHTML = `DNA crossover probability: ${(mission.crossoverProbability * 100).toFixed(2)}%`;
    hud.appendChild(crossoverProbability);

    const mutationProbability = document.createElement('p');
    mutationProbability.classList.add('hud__item');
    mutationProbability.innerHTML = `DNA mutation probability: ${(mission.population.mutationProbability * 100).toFixed(2)}%`;
    hud.appendChild(mutationProbability);

    const playButton = document.createElement('img');
    playButton.src = `assets/play-button.svg`;
    playButton.classList.add('play-button');

    space.appendChild(hud);

    if (mission.started) {
      playButton.classList.add('play-button_hidden');
    }

    space.appendChild(playButton);

    // Start mission when you click on the play button.
    playButton.addEventListener('click', () => {
      if (!mission.started) {
        mission.started = true;
        playButton.classList.add('play-button_hidden');
        mission.run();
      }
    });
  }
}

class Mission {
  constructor(
    target,
    lifeSpan,
    populationSize,
    crossoverProbability
  ) {
    this.startingPosition = new Coordinate(window.innerWidth / 2, 32);
    this.started = false;
    this.completed = false;

    this.count = 0;
    this.lifeSpan = lifeSpan;
    this.crossoverProbability = crossoverProbability;

    this.target = target;
    this.earth = new Planet(window.innerWidth / 2, 0, 'earth.svg');
    this.asteroids = [];

    this.population;
    this.populationSize = populationSize;
    this.populationCount = 0;

    this.hud = new HUD();

    // The maximum distance offset for the fitness function.
    this.maxXOffset = this.target.x - this.target.width / 2;
    this.maxYOffset = this.target.y - this.target.height / 2;
    this.maxOffset = this.maxXOffset + this.maxYOffset;

    // Binding the context to the methods.
    this.run = this.run.bind(this);
    this.initialize = this.initialize.bind(this);
  }

  run() {
    // Check if mission is completed.
    if (this.population.completed()) {
      this.completed = true;

      // Clear the DOM.
      space.innerHTML = '';

      // Setup the planets and astroids.
      this.target.render();
      this.earth.render();
      for (let i = 0; i < this.asteroids.length; i++) {
        this.asteroids[i].render();
      }

      // Re-render the population.
      this.population.render();
      this.population.evaluate();

      // Update the HUD.
      this.hud.render();

      return true;
    }

    if (this.count === this.lifeSpan) {

      // Clear the DOM.
      space.innerHTML = '';
      this.count = 0;

      // Setup the planets.
      this.target.render();
      this.earth.render();
      for (let i = 0; i < this.asteroids.length; i++) {
        this.asteroids[i].render();
      }

      // Evolve the population.
      this.population.crossover();
      this.population.render();
      this.populationCount++;

      // Update the HUD.
      this.hud.render();

      // Run this method recursifly.
      setTimeout(this.run, 126);
    } else {
      // Propel all the rockets.
      this.population.propel(this.count);

      // Run this method recursifly.
      this.count++;
      setTimeout(this.run, 126);
    }
  }

  addAsteroid(x, y) {
    this.asteroids.push(new Planet(x, y, 'asteroid.svg'));

    for (let i = 0; i < this.asteroids.length; i++) {
      this.asteroids[i].render();
    }
  }

  removeAsteroid(index) {
    this.asteroids.splice(index, 1);

    // Clear the DOM.
    space.innerHTML = '';

    // Setup the planets and astroids.
    this.target.render();
    this.earth.render();
    for (let i = 0; i < this.asteroids.length; i++) {
      this.asteroids[i].render();
    }

    // Re-render the population.
    this.population.render();

    // Re-render the HUD.
    this.hud.render();
  }

  initialize() {
    // Display initial rockets and mars.
    this.target.render();
    this.earth.render();
    for (let i = 0; i < this.asteroids.length; i++) {
      this.asteroids[i].render();
    }

    // Create an inital random rocket population.
    this.population = new Population(this.populationSize);
    this.population.render();

    this.hud.render();
  }
}

const space = document.querySelector('.space');
const target = new Planet(window.innerWidth / 2, window.innerHeight - 126, undefined, 64);
const mission = new Mission(target, 48, 32, .5);

mission.initialize();

// On left clikc add an astroid.
window.addEventListener('click', (event) => {
  const actualY = window.innerHeight - event.y;

  event.preventDefault();

  if (!(event.x > window.innerWidth / 2 - 32
      && event.x < window.innerWidth / 2 + 32
      && actualY > window.innerHeight / 2 - 32
      && actualY < window.innerHeight / 2 + 32)
  ) {
    mission.addAsteroid(event.x, actualY);
  }
});

// On right click remove the astroid.
window.addEventListener('contextmenu', (event) => {
  const actualY = window.innerHeight - event.y;

  event.preventDefault();

  for (let i =  0; i < mission.asteroids.length; i++) {
    if (event.x > mission.asteroids[i].position.x - mission.asteroids[i].width / 2
        && event.x < mission.asteroids[i].position.x + mission.asteroids[i].width / 2
        && actualY > mission.asteroids[i].position.y - mission.asteroids[i].height / 2
        && actualY < mission.asteroids[i].position.y + mission.asteroids[i].height / 2
    ) {
      mission.removeAsteroid(i);
    }
  }
});
