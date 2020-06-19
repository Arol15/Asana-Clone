'use-strict'
const React = window.React;
const ReactDOM = window.ReactDOM;
const { DragDropContext, Draggable, Droppable } = window.ReactBeautifulDnd;

class App extends React.Component {
  state = {
    tasks: {
      'task-1': { id: 'task-1', content: 'Take out the garbage' },
      'task-2': { id: 'task-2', content: 'Watch my favorite show' },
      'task-3': { id: 'task-3', content: 'Charge my phone' },
      'task-4': { id: 'task-4', content: 'Cook dinner' },
    },
    columns: {
      'column-1': {
        id: 'column-1',
        title: 'To do',
        taskIds: ['task-1', 'task-2', 'task-3', 'task-4'],
      },
      'column-2': {
        id: 'column-2',
        title: 'In progress',
        taskIds: [],
      },
      'column-3': {
        id: 'column-3',
        title: 'Done',
        taskIds: [],
      },
    },
    // Facilitate ordering of columns
    columnOrder: ['column-1', 'column-2', 'column-3'],
  }

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }
    return (
      <button onClick={() => { }}>Like</button>
    )
  }
}
const domContainer = document.querySelector('#board');
ReactDOM.render(<App />, domContainer);
