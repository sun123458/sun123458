import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const COLUMNS = {
  todo: {
    id: 'todo',
    title: '待办',
  },
  inProgress: {
    id: 'inProgress',
    title: '进行中',
  },
  done: {
    id: 'done',
    title: '已完成',
  },
};

const INITIAL_DATA = {
  tasks: {
    'task-1': { id: 'task-1', title: '示例任务', description: '这是一个示例任务的描述' },
  },
  columns: {
    todo: {
      id: 'todo',
      taskIds: ['task-1'],
    },
    inProgress: {
      id: 'inProgress',
      taskIds: [],
    },
    done: {
      id: 'done',
      taskIds: [],
    },
  },
  columnOrder: ['todo', 'inProgress', 'done'],
};

function App() {
  const [data, setData] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  useEffect(() => {
    const savedData = localStorage.getItem('kanbanData');
    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      setData(INITIAL_DATA);
    }
  }, []);

  useEffect(() => {
    if (data) {
      localStorage.setItem('kanbanData', JSON.stringify(data));
    }
  }, [data]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = data.columns[source.droppableId];
    const endColumn = data.columns[destination.droppableId];

    if (startColumn === endColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };

      const newData = {
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      };

      setData(newData);
    } else {
      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStart = {
        ...startColumn,
        taskIds: startTaskIds,
      };

      const endTaskIds = Array.from(endColumn.taskIds);
      endTaskIds.splice(destination.index, 0, draggableId);
      const newEnd = {
        ...endColumn,
        taskIds: endTaskIds,
      };

      const newData = {
        ...data,
        columns: {
          ...data.columns,
          [newStart.id]: newStart,
          [newEnd.id]: newEnd,
        },
      };

      setData(newData);
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTaskId = `task-${Date.now()}`;
    const newTask = {
      id: newTaskId,
      title: newTaskTitle,
      description: newTaskDescription,
    };

    const newData = {
      ...data,
      tasks: {
        ...data.tasks,
        [newTaskId]: newTask,
      },
      columns: {
        ...data.columns,
        todo: {
          ...data.columns.todo,
          taskIds: [...data.columns.todo.taskIds, newTaskId],
        },
      },
    };

    setData(newData);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setShowAddTask(false);
  };

  const handleDeleteTask = (taskId) => {
    const newTasks = { ...data.tasks };
    delete newTasks[taskId];

    const newColumns = {};
    Object.keys(data.columns).forEach(columnId => {
      newColumns[columnId] = {
        ...data.columns[columnId],
        taskIds: data.columns[columnId].taskIds.filter(id => id !== taskId),
      };
    });

    const newData = {
      ...data,
      tasks: newTasks,
      columns: newColumns,
    };

    setData(newData);
  };

  if (!data) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">看板</h1>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md"
          >
            {showAddTask ? '取消' : '添加任务'}
          </button>
        </div>

        {showAddTask && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <form onSubmit={handleAddTask}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">任务标题</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="输入任务标题..."
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">任务描述</label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  rows="3"
                  placeholder="输入任务描述..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                创建任务
              </button>
            </form>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

              return (
                <div key={column.id} className="bg-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {COLUMNS[column.id].title}
                    </h2>
                    <span className="bg-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      {tasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] space-y-3 ${
                          snapshot.isDraggingOver ? 'bg-blue-100 rounded-lg' : ''
                        }`}
                      >
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200 ${
                                  snapshot.isDragging ? 'shadow-xl rotate-2' : ''
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800 mb-2">
                                      {task.title}
                                    </h3>
                                    {task.description && (
                                      <p className="text-gray-600 text-sm">
                                        {task.description}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors duration-200 ml-2"
                                    aria-label="删除任务"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

export default App;
