import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Modal, Menu, Popover, Alert, FloatButton, Typography } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useSearch, useMenuContext } from '../../contexts/SearchContext';
import headerStyles from '../../styles/headerStyles';
import './taskPage.css';

import ContentLoader from '../contentLoader/ContentLoader';
import redDotSvg from '../../assets/images/Ellipse red.svg';
import GreenDotSvg from '../../assets/images/Ellipse green.svg';

import greenDotSvg from '../../assets/images/Ellipse 12.svg';
import yellowDotSvg from '../../assets/images/Ellipse yellow.svg';
import blueDotSvg from '../../assets/images/Ellipse blue.svg';

import { useCollectionData } from 'react-firebase-hooks/firestore';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  addDoc,
} from 'firebase/firestore';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../../utils/constants/Firebase';
import dbNames from '../../utils/constants/db';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
const { Title, Text } = Typography;

const statusColumns = {
  'To-Do': { title: 'To-Do', image: redDotSvg },
  'In Progress': { title: 'In Progress', image: blueDotSvg },
  'Review': { title: 'Review', image: GreenDotSvg },
  'Testing': { title: 'Testing', image: yellowDotSvg },
  'Completed': { title: 'Completed', image: greenDotSvg },
};

const TaskPage = () => {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { userId } = useParams()
  const [tasks, setTasks] = useState([]);

  const docId = useRef();

  const [newTask, setNewTask] = useState({
    title: '',
    assigned: '',
    status: 'To-Do',
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedTask, setEditedTask] = useState({});
  const [editedTaskIndex, setEditedTaskIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchTasks = async () => {
    const tasksList = [];
    try {
      const querySnapshot = await getDocs(
        query(collection(db, dbNames.getTaskCollection(projectId)))
      );
      querySnapshot.forEach((doc) => {
        tasksList.push({ id: doc.id, ...doc.data() });
      });
    } catch (error) {
      console.error('Error fetching tasks: ', error);
    }

    return tasksList;
  };
  useEffect(() => {
    setTimeout(() => {
      setData();
      setLoading(false);
    }, 2000);
  }, []);

  useEffect(() => {
    const fetchTasksData = async () => {
      let taskList = await fetchTasks(projectId);
      taskList = taskList.sort(orderBy(["order"],["asc"]));
      console.table(taskList);
      setTasks(taskList);
      setLoading(false);
    };

    fetchTasksData();
  }, [projectId]);

  const q = collection(db, dbNames.projectCollection);
  const [docs, error] = useCollectionData(q);

  async function handleAddTask() {
    if (newTask.title.trim() !== '') {
      const collectionName = dbNames.getTaskCollection(projectId);
      const taskRef = collection(db, collectionName);
      const docsSet = await getDocs(taskRef);
      const newTaskData = {
        title: newTask.title,
        projectId: projectId,
        status: newTask.status,
        order: docsSet.size+1
      };

      try {
        const docRef = await addDoc(taskRef, newTaskData);
        const addedTask = { id: docRef.id, ...newTaskData };

        setTasks([...tasks, addedTask]);

        setNewTask({
          title: '',
          status: 'To-Do',
        });
      } catch (error) {
        console.error('Error adding task to Firestore:', error);
      }
    }
  }


  const deleteTask = async (taskId) => {
    try {
      const collectionName = dbNames.getTaskCollection(projectId);
      const taskRef = doc(db, collectionName, taskId);
      await deleteDoc(taskRef);

      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDeleteTask = (taskId) => {
    deleteTask(taskId);
  };

  const openEditModal = (task, index) => {
    setEditedTask(task);
    setEditedTaskIndex(index);
    setEditModalVisible(true);
  };

  const handleUpdateTask = async () => {
    if (editedTaskIndex !== null) {
      const updatedTasks = [...tasks];
      updatedTasks[editedTaskIndex] = editedTask;
      setTasks(updatedTasks);

      try {
        const collectionName = dbNames.getTaskCollection(projectId);
        const taskRef = doc(db, collectionName, editedTask.id);
        await setDoc(taskRef, editedTask);
      } catch (error) {
        console.error('Error updating task:', error);
      }

      setEditModalVisible(false);
      setEditedTask({});
      setEditedTaskIndex(null);
    }
  };

  const content = (
    <div className='pop-content-container'>
      <Title className='pop-title'>Tasks</Title>
      <Input
        ref={docId}
        type="text"
        className='title-input'
        placeholder="Task Title"
        value={newTask.title}
        onChange={(e) => {
          setNewTask({ ...newTask, title: e.target.value });
        }}
      />
      {/* <select
        className='pop-select'
        value={newTask.status}
        ref={docId}
        onChange={(e) => {
          setNewTask({ ...newTask, status: e.target.value });
        }}
      >
        <option value="To-Do">To-Do</option>
        <option value="In Progress">In Progress</option>
        <option value="Review">In Review</option>
        <option value="Testing">Testing</option>
        <option value="Completed">Completed</option>
      </select> */}
      <Button className='task-add' onClick={handleAddTask}>Add Task</Button>

    </div>
  );

  const statusImg = {
    'To-Do': redDotSvg,
    'In Progress': blueDotSvg,
    'Review': GreenDotSvg,
    'Testing': greenDotSvg,
    'Completed': yellowDotSvg,
  };

  // const handleStatusFilterChange = (key) => {
  //   setMenuFilter(key);
  // };

  // const { menuFilter, setMenuFilter } = useMenuContext();

  const onDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const sourceStatus = result.source.droppableId;
    const destinationStatus = result.destination.droppableId;
    const taskId = result.draggableId;

    if (sourceStatus !== destinationStatus) {
      // const updatedTasks = tasks.map((task) => {
      //   if (task.id === taskId) {
      //     return { ...task, status: destinationStatus }

      //   }
      //   return task;
        
      // });

      // setTasks(updatedTasks);

      const taskToMove = tasks.find((task) => task.id === taskId);

      taskToMove.status =  destinationStatus;
       const updateData = {status: destinationStatus};
      if (result.destination.index != result.source.index){
        updateData['order']=  result.destination.index;
        reorder({status: destinationStatus});
      }
      saveTask(updateData,taskId);
     
    } else {
      
 
      if (result.destination.index != result.source.index){
       
        reorder();
        console.log({ id: taskId, order: result.destination.index })
        saveTask({  order: result.destination.index },taskId);
      }
      
    }
    function reorder(fields){
      let prev = tasks.find(t=> t.order === result.destination.index),
            next = tasks.find(t=> t.order === result.source.index);
            if(prev){
              prev.order = result.source.index;
            }
           
           if(next){
            next.order = result.destination.index;
            next = {...next , fields};
           }
           
       
          const  reordered = tasks.sort(orderBy(["order"],["asc"]));
            setTasks(reordered);
      
    }
      async function saveTask (taskData, id)   { 
      try {
        const collectionName = dbNames.getTaskCollection(projectId);
        const taskRef = doc(db, collectionName, id);
        delete taskData.id;
        setDoc(taskRef,taskData,{merge:true});
      } catch (error) {
        console.error('Error updating task in Firestore:', error);
      }
     } 
  };

  function sortBy( key, cb ) {
    if ( !cb ) cb = () => 0;
    return ( a, b ) => ( a[key] > b[key] ) ? 1 :
        ( ( b[key] > a[key] ) ? -1 : cb( a, b ) );
}

function sortByDesc( key, cb ) {
    if ( !cb ) cb = () => 0;
    return ( b, a ) => ( a[key] > b[key] ) ? 1 :
        ( ( b[key] > a[key] ) ? -1 : cb( b, a ) );
}

function orderBy( keys, orders ) {
    let cb = () => 0;
    keys.reverse();
    orders.reverse();
    for ( const [i, key] of keys.entries() ) {
        const order = orders[i];
        if ( order == 'asc' )
            cb = sortBy( key, cb );
        else if ( order == 'desc' )
            cb = sortByDesc( key, cb );
        else
            throw new Error( `Unsupported order "${order}"` );
    }
    return cb;
}

  return (
    <div>
      {loading ? (
        <ContentLoader />
      ) : (
        <div>
          <div className="navbar">
            <div className="new-project">
              <Popover placement="bottom" content={content}>
                <Button className="newbtn">
                  <PlusOutlined />
                  New
                </Button>
              </Popover>
            </div>


          </div>


          {/* Kanban Board */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board">
              {Object.keys(statusColumns).map((status) => (
                <Droppable droppableId={status} key={status}>
                  {(provided, snapshot) => (
                    <div
                      className={`kanban-column ${status.toLowerCase()}`}
                      ref={provided.innerRef}
                    >
                      <Title className='card-status'>{status}</Title>
                      { tasks
                        .filter((task) => task.status === status)
                        .map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`task-card ${status.toLowerCase()}`}
                              >
                                <Title className='card-title'>{task.title}</Title>
                                <div className="task-status-container">
                                  <img src={statusImg[task.status]} alt="dot" />
                                  <Text className='task-status'>{task.status}</Text>
                                </div>
                                <Button className='task-del-btn' onClick={() => handleDeleteTask(task.id)}>Delete</Button>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
          {/* 
          <Modal
            title="Edit Task"
            visible={editModalVisible}
            onOk={handleUpdateTask}
            onCancel={() => {
              setEditModalVisible(false);
              setEditedTask({});
              setEditedTaskIndex(null);
            }}
          >
            <Input
              type="text"
              placeholder="Task Title"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Assigned"
              value={editedTask.assigned}
              onChange={(e) => setEditedTask({ ...editedTask, assigned: e.target.value })}
            />
            <select
              value={editedTask.status}
              onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
            >
              {Object.keys(statusColumns).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Modal> */}
          {loading && <Alert className="alert-message" message=" Loading..." type="success" />}
        </div>
      )}
      <FloatButton
        shape="circle"
        type="primary"
        icon={<ArrowLeftOutlined />}
        onClick={() => {
          navigate(`/dashboard/project/${userId}`)
        }}
        style={{
          right: 50,
        }}
      />

    </div>
  );
};

export default TaskPage;

// import React, { useState, useEffect, useRef } from 'react';
// import { Card, Input, Button, Modal, Menu, Popover, Alert } from 'antd';
// import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
// import { useSearch, useMenuContext } from '../../contexts/SearchContext';
// import headerStyles from '../../styles/headerStyles';
// import './taskPage.css';
// import ContentLoader from '../contentLoader/ContentLoader';

// import redDotSvg from '../../assets/images/Ellipse red.svg';
// import greenDotSvg from '../../assets/images/Ellipse 12.svg';
// import yellowDotSvg from '../../assets/images/Ellipse yellow.svg';
// import { useCollectionData } from 'react-firebase-hooks/firestore';
// import {
//   collection,
//   doc,
//   setDoc,
//   deleteDoc,
//   getDocs,
//   query,
//   addDoc,
// } from 'firebase/firestore';
// import { useParams } from 'react-router-dom';
// import { db } from '../../utils/constants/Firebase';
// import dbNames from '../../utils/constants/db';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// const statusColumns = {
//   'To-Do': { title: 'To-Do', image: redDotSvg },
//   'In Progress': { title: 'In Progress', image: yellowDotSvg },
//   'On Hold': { title: 'On Hold', image: yellowDotSvg },
//   'Completed': { title: 'Completed', image: greenDotSvg },
//   'Review': { title: 'Review', image: yellowDotSvg },
// };

// const TaskPage = () => {
//   const { projectId } = useParams();

//   const [tasks, setTasks] = useState([]);

//   const docId = useRef();

//   const [newTask, setNewTask] = useState({
//     title: '',
//     assigned: '',
//     status: 'In Progress',
//   });

//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [editedTask, setEditedTask] = useState({});
//   const [editedTaskIndex, setEditedTaskIndex] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [data, setData] = useState(null);

//   const fetchTasks = async () => {
//     const tasksList = [];
//     try {
//       const querySnapshot = await getDocs(
//         query(collection(db, dbNames.getTaskCollection(projectId)))
//       );
//       querySnapshot.forEach((doc) => {
//         tasksList.push({ id: doc.id, ...doc.data() });
//       });
//     } catch (error) {
//       console.error('Error fetching tasks: ', error);
//     }

//     return tasksList;
//   };
//   useEffect(() => {
//     setTimeout(() => {
//       setData();
//       setLoading(false);
//     }, 2000);
//   }, []);

//   useEffect(() => {
//     const fetchTasksData = async () => {
//       const taskList = await fetchTasks(projectId);
//       setTasks(taskList);
//       setLoading(false);
//     };

//     fetchTasksData();
//   }, [projectId]);

//   const q = collection(db, dbNames.projectCollection);
//   const [docs, error] = useCollectionData(q);

//   async function handleAddTask() {
//     if (newTask.title.trim() !== '') {
//       const collectionName = dbNames.getTaskCollection(projectId);
//       const taskRef = collection(db, collectionName);
//       const newTaskData = {
//         title: newTask.title,
//         projectId: projectId,
//         assigned: newTask.assigned,
//         status: newTask.status,
//       };
  
//       try {
//         const docRef = await addDoc(taskRef, newTaskData);
//         const addedTask = { id: docRef.id, ...newTaskData };
  
//         setTasks([...tasks, addedTask]);
  
//         setNewTask({
//           title: '',
//           assigned: '',
//           status: 'In Progress',
//         });
//       } catch (error) {
//         console.error('Error adding task to Firestore:', error);
//       }
//     }
//   }
  

//   const deleteTask = async (taskId) => {
//     try {
//       const collectionName = dbNames.getTaskCollection(projectId);
//       const taskRef = doc(db, collectionName, taskId);
//       await deleteDoc(taskRef);

//       const updatedTasks = tasks.filter((task) => task.id !== taskId);
//       setTasks(updatedTasks);
//     } catch (error) {
//       console.error('Error deleting task:', error);
//     }
//   };

//   const handleDeleteTask = (taskId) => {
//     deleteTask(taskId);
//   };

//   const openEditModal = (task, index) => {
//     setEditedTask(task);
//     setEditedTaskIndex(index);
//     setEditModalVisible(true);
//   };

//   const handleUpdateTask = async () => {
//     if (editedTaskIndex !== null) {
//       const updatedTasks = [...tasks];
//       updatedTasks[editedTaskIndex] = editedTask;
//       setTasks(updatedTasks);

//       try {
//         const collectionName = dbNames.getTaskCollection(projectId);
//         const taskRef = doc(db, collectionName, editedTask.id);
//         await setDoc(taskRef, editedTask);
//       } catch (error) {
//         console.error('Error updating task:', error);
//       }

//       setEditModalVisible(false);
//       setEditedTask({});
//       setEditedTaskIndex(null);
//     }
//   };

//   const content = (
//     <div>
//       <h1>Tasks</h1>
//       <Input
//         ref={docId}
//         type="text"
//         placeholder="Task Title"
//         value={newTask.title}
//         onChange={(e) => {
//           setNewTask({ ...newTask, title: e.target.value });
//         }}
//       />
//       <Input
//         ref={docId}
//         type="text"
//         placeholder="Assigned"
//         value={newTask.assigned}
//         onChange={(e) => {
//           setNewTask({ ...newTask, assigned: e.target.value });
//         }}
//       />
//       <select
//         value={newTask.status}
//         ref={docId}
//         onChange={(e) => {
//           setNewTask({ ...newTask, status: e.target.value });
//         }}
//       >
//         <option value="In Progress">In Progress</option>
//         <option value="Discussing">Discussing</option>
//         <option value="Completed">Completed</option>
//         <option value="Review">Review</option>
//         <option value="Cancelled">Cancelled</option>
//         <option value="On Hold">On Hold</option>
//       </select>
//       <Button onClick={handleAddTask}>Add Task</Button>
//     </div>
//   );

//   const statusImg = {
//     'To-Do': redDotSvg,
//     'In Progress': yellowDotSvg,
//     'On Hold': yellowDotSvg,
//     'Completed': greenDotSvg,
//     'Review': yellowDotSvg,
//   };

//   const handleStatusFilterChange = (key) => {
//     setMenuFilter(key);
//   };

//   const { menuFilter, setMenuFilter } = useMenuContext();

//   const onDragEnd = async (result) => {
//     if (!result.destination) {
//       return; 
//     }

//     const sourceStatus = result.source.droppableId;
//     const destinationStatus = result.destination.droppableId;
//     const taskId = result.draggableId;

//     if (sourceStatus !== destinationStatus) {
//       const updatedTasks = tasks.map((task) => {
//         if (task.id === taskId) {
//           return { ...task, status: destinationStatus };
//         }
//         return task;
//       });

//       setTasks(updatedTasks);

//       if (result.source.index !== result.destination.index) {
//         const taskToMove = updatedTasks.find((task) => task.id === taskId);
//         const updatedTaskData = {
//           ...taskToMove,
//           status: destinationStatus,
//         };

//         try {
//           const collectionName = dbNames.getTaskCollection(projectId);
//           const taskRef = doc(db, collectionName, taskId);
//           await setDoc(taskRef, updatedTaskData);
//         } catch (error) {
//           console.error('Error updating task in Firestore:', error);
//         }
//       }
//     } else {
//       const reorderedTasks = Array.from(tasks);
//       const [removed] = reorderedTasks.splice(result.source.index, 1);
//       reorderedTasks.splice(result.destination.index, 0, removed);
      
//       setTasks(reorderedTasks);

//       if (result.source.index !== result.destination.index) {
//         try {
//           const collectionName = dbNames.getTaskCollection(projectId);
//           const taskRef = doc(db, collectionName, taskId);
//           await setDoc(taskRef, { ...removed, status: sourceStatus });
//         } catch (error) {
//           console.error('Error updating task order in Firestore:', error);
//         }
//       }
//     }
//   };

  

//   return (
//     <div>
//       {loading ? (
//         <ContentLoader />
//       ) : (
//         <div>
//           <div className="navbar">
//             <div className="new-project">
//               <Popover placement="bottom" content={content}>
//                 <Button className="newbtn">
//                   <PlusOutlined />
//                   New
//                 </Button>
//               </Popover>
//             </div>

//             <div className="filterMenu">
//               {/* <Menu
//                 style={headerStyles.AdditonalMenuStyle}
//                 value={menuFilter}
//                 onClick={handleStatusFilterChange}
//               >
//                 <Menu.Item key="All">All</Menu.Item>
//                 <Menu.Item key="In Progress">In Progress</Menu.Item>
//                 <Menu.Item key="On Hold">On Hold</Menu.Item>
//                 <Menu.Item key="Completed">Completed</Menu.Item>
//               </Menu> */}
//             </div>
//           </div>

//           {/* Kanban Board */}
//           <DragDropContext onDragEnd={onDragEnd}>
//             <div className="kanban-board">
//               {Object.keys(statusColumns).map((status) => (
//                 <Droppable droppableId={status} key={status}>
//                   {(provided, snapshot) => (
//                     <div
//                       className={`kanban-column ${status.toLowerCase()}`}
//                       ref={provided.innerRef}
//                     >
//                       <h2>{status}</h2>
//                       {tasks
//                         .filter((task) => task.status === status)
//                         .map((task, index) => (
//                           <Draggable
//                             key={task.id}
//                             draggableId={task.id}
//                             index={index}
//                           >
//                             {(provided, snapshot) => (
//                               <Card
//                                 ref={provided.innerRef}
//                                 {...provided.draggableProps}
//                                 {...provided.dragHandleProps}
//                                 className={`card ${status.toLowerCase()}`}
//                               >
//                                 <h2>{task.title}</h2>
//                                 <p>Assigned: {task.assigned}</p>
//                                 <div className="status">
//                                   <img src={statusImg[task.status]} alt="dot" />
//                                   <p>{task.status}</p>
//                                 </div>
//                                 <Button onClick={() => openEditModal(task, index)}>Edit</Button>
//                                 <Button onClick={() => handleDeleteTask(task.id)}>Delete</Button>
//                               </Card>
//                             )}
//                           </Draggable>
//                         ))}
//                       {provided.placeholder}
//                     </div>
//                   )}
//                 </Droppable>
//               ))}
//             </div>
//           </DragDropContext>

//           <Modal
//             title="Edit Task"
//             visible={editModalVisible}
//             onOk={handleUpdateTask}
//             onCancel={() => {
//               setEditModalVisible(false);
//               setEditedTask({});
//               setEditedTaskIndex(null);
//             }}
//           >
//             <Input
//               type="text"
//               placeholder="Task Title"
//               value={editedTask.title}
//               onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
//             />
//             <Input
//               type="text"
//               placeholder="Assigned"
//               value={editedTask.assigned}
//               onChange={(e) => setEditedTask({ ...editedTask, assigned: e.target.value })}
//             />
//             <select
//               value={editedTask.status}
//               onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
//             >
//               {Object.keys(statusColumns).map((status) => (
//                 <option key={status} value={status}>
//                   {status}
//                 </option>
//               ))}
//             </select>
//           </Modal>
//           {loading && <Alert className="alert-message" message=" Loading..." type="success" />}
//         </div>
//       )}
//     </div>
//   );
// };

// export default TaskPage;
