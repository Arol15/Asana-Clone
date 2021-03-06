const { expect } = require('chai');
const moment = require('moment');
const { pause, loadModel, migrationsConfig, seedsConfig, moduleInitializationErrorMessage } = require('./test-utils');
const Runner = require('umzug');

function stopTest(message) {
  if (message) {
    expect.fail(message);
    return true;
  }
  return false;
}

async function testCreate(callback) {
  let succeeded = true;
  try {
    await callback();
  } catch (e) {
    succeeded = false;
  }
  return succeeded;
}

async function createModel(Model, object) {
  let instance = null;
  await testCreate(async () => {
    instance = await Model.create(object);
  });
  return instance;
}

let uniqueId = 0;
function str(n = -1) {
  uniqueId += 1;
  let str = `test${uniqueId}`;
  if (n === -1) {
    n = str.length;
  }
  while (str.length < n) {
    str += str;
  }
  return str.substring(0, n);
}

function j(o) {
  return `\n${JSON.stringify(o, null, 2)}`;
}

function email() {
  return `${str()}@example.com`;
}

const passwordSample = 'Abc1!'

function userValues(o) {
  return {
    firstName: str(20), 
    lastName: str(20), 
    hashedPassword: passwordSample,
    email: email(200),
    teamId: Math.floor(Math.random() * 2),
    ...o
  };
}

function columnValues(o) {
  return {
    columnName: str(75),
    projectId: Math.floor(Math.random() * 1),
    columnPos: 1,
    ...o
  };
}

function projectValues(o) {
  return {
    projectName: str(75),
    teamId: 1,
    ...o
  };
}

function taskValues(o) {
  return {
    taskDescription: str(255),
    dueDate: new Date(),
    columnId: 3,
    columnIndx: Math.floor(Math.random() * 5),
    ...o
  };
}

function teamValues(o) {
  return {
    teamName: str(50),
    ...o
  };
}

function formatDate(d) {
  if (!d) return null;
  const m = moment(d);
  m.add(-m.utcOffset(), 'm');
  return m.format('YYYY-MM-DD');
}

describe('The model', () => {
  let errorMessage;
  before(async () => {
    if (migrationsConfig && seedsConfig) {
      const migrator = new Runner(migrationsConfig);
      const seeder = new Runner(seedsConfig);
      try {
        await seeder.down({ to: 0 });
        await pause(0.25);
        await migrator.down({ to: 0 });
        await pause(0.25);
        await migrator.up();
        // await pause(0.25);
        // await seeder.up();
        // await pause(0.25);
      } catch (e) {
        console.error(e);
        errorMessage = `Error running migrations or seeds in before hook. See stack trace above for more details. Error message: ${e.message}`;
      }
    } else {
      errorMessage = moduleInitializationErrorMessage;
    }
  });

  after(async () => {
    if (migrationsConfig && seedsConfig) {
      const migrator = new Runner(migrationsConfig);
      const seeder = new Runner(seedsConfig);
      try {
        await seeder.down({ to: 0 });
        await pause(0.25);
        await migrator.down({ to: 0 });
        await pause(0.25);
        await migrator.up();
      } catch (e) {
        console.error(e);
        errorMessage = `Error running migrations or seeds in after hook. See stack trace above for more details. Error message: ${e.message}`;
      }
    } else {
      errorMessage = moduleInitializationErrorMessage;
    }
  });

  context('Teams Table', () => {
    it('exists and creates a good instance', async () => {
      const { models, error } = loadModel('Team');
      if (stopTest(errorMessage || error)) return;

      const { Team } = models;
      let succeeded;

      const values = teamValues();
      succeeded = await createModel(Team, values);
      if (!succeeded) return expect.fail(`Could not create a Team with ${j(values)}`);
    });

    it('will fail to create with null teamName', async () => {
      const { models, error } = loadModel('Team');
      if (stopTest(errorMessage || error)) return;

      const { Team } = models;
      let succeeded;

      succeeded = await createModel(Team, teamValues({ teamName: null }));
      if (succeeded) return expect.fail('Created a Team with a null teamName');
    });

    it('queries Team data', async () => {
      const { models, error } = loadModel('Team');
      if (stopTest(errorMessage || error)) return;

      const { Team } = models;

      const records = await Team
        .findAll({ where: { id: 1 } })
        .map(x => ({
          teamName: x.teamName
        }));

      expect(records).to.eql([
        { teamName: 'test1test1test1test1test1test1test1test1test1test1'}
      ]);
    });

    it('can eagerly fetch associated Project data', async () => {
      const { models, error } = loadModel(['Team', 'Project']);
      if (stopTest(errorMessage || error)) return;

      const { Team, Project } = models;

      let succeeded;

      succeeded = await createModel(Project, projectValues({ teamId: 1 }));

      const records = await Team
        .findAll({ where: { id: 1 }, include: Project })
        .map(x => ({
          numberOfProject: x.Projects.length
        }));

      expect(records[0]).to.have.property('numberOfProject', 1);
    });
  });

  context('User Table', () => {
    let teamId = -1;
    let userError;
    before(async () => {
      if (errorMessage) return;

      const { models, error } = loadModel('Team');

      if (error) {
        userError = `For User tests, ${error}`;
        return;
      }

      const { Team } = models;

      const values = teamValues();
      const team = await createModel(Team, values);
      if (team) {
        teamId = team.id;
      }

      if (!userError && teamId === -1) {
        userError = `Could not create a Team for the User tests with ${j(values)}`;
      }
    });

    it('exists and creates a good instance', async () => {
      const { models, error } = loadModel('User');
      if (stopTest(errorMessage || userError || error)) return;

      const { User } = models;

      const values = userValues({ teamId });
      succeeded = await createModel(User, values);
      if (!succeeded) return expect.fail(`Could not create an User with ${j(values)}`);
    });

    it('will fail to create with null values', async () => {
      const { models, error } = loadModel('User');
      if (stopTest(errorMessage || userError || error)) return;

      const { User } = models;

      const attempts = [
        [{ teamId, firstName: null }, 'firstName'],
        [{ teamId, lastName: null }, 'lastName'],
        [{ teamId, hashedPassword: null }, 'hashedPassword'],
        [{ teamId, email: null }, 'email'],
        [{ teamId: null }, 'teamId']
      ];
      for (let attempt of attempts) {
        const [nulls, columnName] = attempt;
        const values = columnValues(nulls);
        const succeeded = await createModel(User, values);
        if (succeeded) expect.fail(`Created an User with a null ${columnName}`);
      }
    });

    it('will fail to create with duplicate email', async () => {
      const { models, error } = loadModel('User');
      if (stopTest(errorMessage || userError || error)) return;

      const { User } = models;
      let succeeded;

      const duplicateEmail = email();
      await createModel(User, userValues({ email: duplicateEmail }));
      succeeded = await createModel(User, userValues({ email: duplicateEmail }));
      if (succeeded) return expect.fail('Created a User with a duplicate email');
    });

    it('will fail to create with a non-existent team id', async () => {
      const { models, error } = loadModel('User');
      if (stopTest(errorMessage || userError || error)) return;

      const { User } = models;

      const values = userValues({ teamId: -1 });
      succeeded = await createModel(User, values);
      if (succeeded) return expect.fail(`Created an User with TaskId: -1`);
    });

    it('queries User data', async () => {
      const { models, error } = loadModel('User');
      if (stopTest(errorMessage || userError || error)) return;

      const { User } = models;

      const records = await User
        .findAll({ where: { id: 1 } })
        .map(x => ({
          firstName: x.firstName,
          lastName: x.lastName,
          email: x.email,
          teamId: x.teamId,
        }));

      expect(records).to.eql([
        { firstName: 'test5test5test5test5', lastName: 'test6test6test6test6', email: 'test7@example.com', teamId: 2 }
      ]);
    });

    it('can eagerly fetch associated Team data', async () => {
      const { models, error } = loadModel(['Team', 'User']);
      if (stopTest(errorMessage || userError || error)) return;

      const { Team, User } = models;

      const records = await User
        .findAll({ where: { id: 1 }, include: Team })
        .map(x => ({
          teamName: x.Team.teamName,
        }));

      expect(records[0]).to.eql({ teamName: 'test4test4test4test4test4test4test4test4test4test4' });
    });
  });

  context('Project Table', () => {
    let teamId = -1;
    let projectError;
    before(async () => {
      if (errorMessage) return;

      const { models, error } = loadModel('Team');

      if (error) {
        projectError = `For Project tests, ${error}`;
        return;
      }

      const { Team } = models;

      const values = teamValues();
      const team = await createModel(Team, values);
      if (Team) {
        teamId = team.id;
      }

      if (!projectError && teamId === -1) {
        projectError = `Could not create a Team for the Project tests with ${j(values)}`;
      }
    });

    it('exists and creates a good instance', async () => {
      const { models, error } = loadModel('Project');
      if (stopTest(errorMessage || projectError || error)) return;

      const { Project } = models;

      const values = projectValues({ teamId });
      const succeeded = await createModel(Project, values);
      if (!succeeded) return expect.fail(`Could not create an Project with ${j(values)}`);
    });

    it('will fail to create with null values', async () => {
      const { models, error } = loadModel('Project');
      if (stopTest(errorMessage || projectError || error)) return;

      const { Project } = models;

      const attempts = [
        [{ teamId, projectName: null }, 'projectName'],
        [{ teamId: null }, 'teamId']
      ];
      for (let attempt of attempts) {
        const [nulls, columnName] = attempt;
        const values = projectValues(nulls);
        const succeeded = await createModel(Project, values);
        if (succeeded) expect.fail(`Created an Project with a null ${columnName}`);
      }
    });

    it('will fail to create with a non-existent team id', async () => {
      const { models, error } = loadModel('Project');
      if (stopTest(errorMessage || projectError || error)) return;

      const { Project } = models;

      const values = projectValues({ teamId: -1 });
      const succeeded = await createModel(Project, values);
      if (succeeded) return expect.fail(`Created a Project with teamId: -1`);
    });

    it('will fail to create with a too-long projectName', async () => {
      const { models, error } = loadModel('Project');
      if (stopTest(errorMessage || projectError || error)) return;

      const { Project } = models;

      const values = projectValues({ teamId, projectName: str(80) });
      const succeeded = await createModel(Project, values);
      if (succeeded) return expect.fail(`Created a Project with a ${j(values)}`);
    });

    it('queries Project data', async () => {
      const { models, error } = loadModel('Project');
      if (stopTest(errorMessage || projectError || error)) return;

      const { Project } = models;

      const records = await Project
        .findAll({ order: ['projectName'], where: { id: 1 } })
        .map(x => ({
          projectName: x.projectName,
          teamId: x.teamId
        }));

      expect(records).to.eql([
        { projectName: 'test3test3test3test3test3test3test3test3test3test3test3test3test3test3test3', teamId: 1}
      ]);
    });

    it('can eagerly fetch associated Team data', async () => {
      const { models, error } = loadModel(['Project', 'Team']);
      if (stopTest(errorMessage || projectError || error)) return;

      const { Project, Team } = models;

      const records = await Project
        .findAll({ order: ['projectName'], where: { id: 1 }, include: Team })
        .map(x => ({
          teamName: x.Team.teamName,
        }));

      expect(records[0]).to.eql({ teamName: 'test1test1test1test1test1test1test1test1test1test1' });
    });
  });

  context('Columns Table', () => {
    let projectId = -1;
    let columnError;
    before(async () => {
      if (errorMessage) return;

      const { models, error } = loadModel('Project');

      if (error) {
        columnError = `For Project tests, ${error}`;
        return;
      }

      const { Project } = models;

      const values = projectValues({ teamId: 2});
      const project = await createModel(Project, values);
      if (Project) {
        projectId = project.id;
      }

      if (!columnError && projectId === -1) {
        columnError = `Could not create a Team for the Column tests with ${j(values)}`;
      }
    });

    it('exists and creates a good instance', async () => {
      const { models, error } = loadModel('Column');
      if (stopTest(errorMessage || columnError || error)) return;

      const { Column } = models;

      const values = columnValues({ projectId });
      const succeeded = await createModel(Column, values);
      if (!succeeded) return expect.fail(`Could not create an Column with ${j(values)}`);
    });

    it('will fail to create with null values', async () => {
      const { models, error } = loadModel('Column');
      if (stopTest(errorMessage || columnError || error)) return;

      const { Column } = models;

      const attempts = [
        [{ projectId, columnName: null }, 'columnName'],
        [{ projectId: null }, 'projectId']
      ];
      for (let attempt of attempts) {
        const [nulls, columnName] = attempt;
        const values = columnValues(nulls);
        const succeeded = await createModel(Column, values);
        if (succeeded) expect.fail(`Created an Column with a null ${columnName}`);
      }
    });

    it('will fail to create with a non-existent project id', async () => {
      const { models, error } = loadModel('Column');
      if (stopTest(errorMessage || columnError || error)) return;

      const { Column } = models;

      const values = columnValues({ projectId: -1 });
      const succeeded = await createModel(Column, values);
      if (succeeded) return expect.fail(`Created an Column with projectId: -1`);
    });

    it('will fail to create with a too-long columnName', async () => {
      const { models, error } = loadModel('Column');
      if (stopTest(errorMessage || columnError || error)) return;

      const { Column } = models;

      const values = columnValues({ projectId, columnName: str(80) });
      const succeeded = await createModel(Column, values);
      if (succeeded) return expect.fail(`Created an Column with ${j(values)}`);
    });

    it('queries Column data', async () => {
      const { models, error } = loadModel('Column');
      if (stopTest(errorMessage || columnError || error)) return;

      const { Column } = models;
      let succeeded;

      const values = columnValues({ projectId: 1 });
      succeeded = await createModel(Column, values);

      const records = await Column
        .findAll({ where: { id: 3 } })
        .map(x => ({
          columnName: x.columnName,
          projectId: x.projectId,
        }));

      expect(records).to.eql([
        { columnName: 'test37test37test37test37test37test37test37test37test37test37test37test37tes', projectId: 1 }
      ]);
    });

    it('can eagerly fetch associated Task data', async () => {
      const { models, error } = loadModel(['Column', 'Task']);
      if (stopTest(errorMessage || columnError || error)) return;

      const { Column, Task } = models;

      let succeeded;
      let values;

      values = columnValues({ projectId: 1 });
      succeeded = await createModel(Column, values);

      values = taskValues({ columnId: 4 });
      succeeded = await createModel(Task, values);

      const records = await Column
        .findAll({ where: { id: 4 }, include: Task })
        .map(x => ({
          numberOfTasks: x.Tasks.length,
        }));

      expect(records[0]).to.eql({ numberOfTasks: 1 });
    });
  });

  context('Task Table', () => {
    let columnId = -1;
    let taskError;
    before(async () => {
      if (errorMessage) return;

      const { models, error } = loadModel('Column');

      if (error) {
        taskError = `For Task tests, ${error}`;
        return;
      }

      const { Column } = models;

      const values = columnValues({ projectId: 1 });
      const column = await createModel(Column, values);
      if (column) {
        columnId = column.id;
      }

      if (!taskError && columnId === -1) {
        taskError = `Could not create a Column for the Task tests with ${j(values)}`;
      }
    });

    it('exists and creates a good instance', async () => {
      const { models, error } = loadModel('Task');
      if (stopTest(errorMessage || taskError || error)) return;

      const { Task } = models;

      const values = taskValues({ columnId });
      succeeded = await createModel(Task, values);
      if (!succeeded) return expect.fail(`Could not create an Task with ${j(values)}`);
    });

    it('will fail to create with null values', async () => {
      const { models, error } = loadModel('Task');
      if (stopTest(errorMessage || taskError || error)) return;

      const { Task } = models;

      const attempts = [
        [{ columnId, taskDescription: null }, 'taskDescription'],
        [{ columnId, columnIndx: null }, 'columnIndx'],
        [{ columnId: null }, 'columnId']
      ];
      for (let attempt of attempts) {
        const [nulls, columnName] = attempt;
        const values = taskValues(nulls);
        const succeeded = await createModel(Task, values);
        if (succeeded) expect.fail(`Created an Task with a null ${columnName}`);
      }
    });

    it('will fail to create with a non-existent column id', async () => {
      const { models, error } = loadModel('Task');
      if (stopTest(errorMessage || taskError || error)) return;

      const { Task } = models;

      const values = taskValues({ columnId: -1 });
      succeeded = await createModel(Task, values);
      if (succeeded) return expect.fail(`Created an Task with columnId: -1`);
    });

    it('queries Task data', async () => {
      const { models, error } = loadModel('Task');
      if (stopTest(errorMessage || taskError || error)) return;

      const { Task } = models;

      const records = await Task
        .findAll({ where: { id: 1 } })
        .map(x => ({
          taskDescription: x.taskDescription,
          columnId: x.columnId
        }));

      expect(records).to.eql([
        { taskDescription: 'test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39test39tes', columnId: 4 }
      ]);
    });

    it('can eagerly fetch associated Column data', async () => {
      const { models, error } = loadModel(['Column', 'Task']);
      if (stopTest(errorMessage || taskError || error)) return;

      const { Column, Task } = models;

      const records = await Task
        .findAll({ where: { id: 1 }, include: Column })
        .map(x => ({
          columnName: x.Column.columnName,
        }));

      expect(records[0]).to.eql({ columnName: 'test38test38test38test38test38test38test38test38test38test38test38test38tes' });
    });
  });

});
