import React, { useEffect, useState, useRef } from 'react';
import './TodoList.css'; // Добавим стили отдельно
import { serverJSON } from './config-server';

const updateViewTodos = (isSortedTodos, search, todos, setViewTodos) => {
	const filteredTodos =
		search === ''
			? todos
			: todos.filter((todo) =>
					todo.title.toLowerCase().includes(search.toLowerCase()),
				);

	const sortedTodos = isSortedTodos
		? [...filteredTodos].sort((a, b) => a.title.localeCompare(b.title))
		: filteredTodos;
	setViewTodos(sortedTodos);
};

const maxId = (todos) => {
	const maxNumber = Math.max(...todos.map((todo) => Number(todo.id)), 0) + 1;
	const str = '00000' + maxNumber;
	return str.slice(-5);
};

const TodoList = () => {
	const [todos, setTodos] = useState([]); //список дел
	const [isLoading, setIsLoading] = useState(false); //лоадер при задержке
	const [refreshTodos, setRefreshTodos] = useState(false); //обновление списка дел

	const [isCreating, setIsCreating] = useState(false); //блокирование кнопки add
	const [newTodo, setNewTodo] = useState(''); //инпут для добавление дела

	const [isUpdating, setIsUpdating] = useState(false); //блокирование кнопки изменить
	const [editingId, setEditingId] = useState(null); //id редактироруемого дела
	const [editingTitle, setEditingTitle] = useState(''); //название редактироруемого дела

	const [isDeleting, setIsDeleting] = useState(false); //блокирование кнопки delete

	const [search, setSearch] = useState(''); //строка поиска
	const [viewTodos, setViewTodos] = useState([]); //список представленных дел с учетом фильтра и сортировкиы

	const [isSortedTodos, setIsSortedTodos] = useState(false); //сортировка

	useEffect(() => {
		setIsLoading(true);

		//mock loading
		// new Promise((resolve) => {
		// 	setTimeout(() => {
		// 		resolve({ json: () => PRODUCTS_MOCK });
		// 	}, 2500);
		// })

		//расскоментить для вызова сервиса https://jsonplaceholder.typicode.com/todos
		// fetch('https://jsonplaceholder.typicode.com/todos')
		fetch(`http://${serverJSON.host}:${serverJSON.port}/todos`)
			.then((loadedData) => loadedData.json())
			.then((loadedTodos) => {
				setTodos(loadedTodos);
				updateViewTodos(
					isSortedTodos,
					// setIsSortedTodos,
					search,
					// setSearch,
					loadedTodos,
					// setTodos,
					setViewTodos,
				);
			})
			.finally(() => setIsLoading(false));
	}, [refreshTodos]); //обновить страницу после fetch

	const addTodo = () => {
		setIsCreating(true); //создание нового

		fetch(`http://${serverJSON.host}:${serverJSON.port}/todos`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json;charset=utf-8' },
			body: JSON.stringify({
				id: maxId(todos),
				title: newTodo,
				completed: false,
			}),
		})
			.then((rawResponse) => rawResponse.json())
			.then((response) => {
				console.log('дело добавлено, ответ сервера:', response);
				setRefreshTodos(!refreshTodos); //обновить страницу
				setNewTodo('');
			})
			.finally(() => setIsCreating(false)); //создание закончено
	};

	const updateTodo = () => {
		if (!editingTitle || editingId === null) return;

		setIsUpdating(true);

		fetch(`http://${serverJSON.host}:${serverJSON.port}/todos/${editingId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json;charset=utf-8' },
			body: JSON.stringify({
				id: editingId,
				title: editingTitle,
				completed: false,
			}),
		})
			.then((rawResponse) => rawResponse.json())
			.then((response) => {
				console.log('дело изменено, ответ сервера:', response);
				setRefreshTodos(!refreshTodos); //обновить страницу
				setEditingId(null);
				setEditingTitle('');
			})
			.finally(() => setIsUpdating(false)); //создание закончено
	};

	const deleteTodo = (id) => {
		setIsDeleting(true);
		fetch(`http://${serverJSON.host}:${serverJSON.port}/todos/${id}`, {
			method: 'DELETE',
		})
			.then((rawResponse) => {
				console.log('ответ сервера: ', rawResponse);
				setRefreshTodos(!refreshTodos); //обновить страницу
			})
			.finally(() => setIsDeleting(false));
	};

	const toggleSort = () => {
		setIsSortedTodos(!isSortedTodos);
		updateViewTodos(!isSortedTodos, search, todos, setViewTodos);
	};

	return (
		<div className="todo-list">
			<h1>Список Дел</h1>
			<div>
				<input
					type="text"
					value={search}
					// onChange={({ target }) => setSearch(target.value)}
					onChange={({ target }) => {
						setSearch(target.value);
						updateViewTodos(
							isSortedTodos,
							// setIsSortedTodos,
							target.value,
							// setSearch,
							todos,
							// setTodos,
							setViewTodos,
						);
					}}
					placeholder="Поиск дела"
				/>
				<button onClick={toggleSort}>
					{isSortedTodos ? 'Снять сортировку' : 'Сортировать по алфавиту'}
				</button>
			</div>
			<div>
				<input
					type="text"
					placeholder="Добавить дело"
					value={newTodo}
					onChange={({ target }) => setNewTodo(target.value)}
				/>
				<button onClick={addTodo} disabled={isCreating}>
					Добавить
				</button>
			</div>

			{isLoading ? (
				<div className="loader"></div> // Лоадер
			) : (
				<ul>
					{viewTodos.map((todo) => (
						<li key={todo.id} className={todo.completed ? 'completed' : ''}>
							{editingId === todo.id ? (
								<div>
									<button onClick={updateTodo}>Сохранить</button>
									<input
										type="text"
										value={editingTitle}
										onChange={({ target }) =>
											setEditingTitle(target.value)
										}
									/>
								</div>
							) : (
								<div>
									<button
										onClick={() => {
											setEditingId(todo.id);
											setEditingTitle(todo.title);
										}}
										disabled={isUpdating}
									>
										Изменить
									</button>
									<button
										onClick={() => deleteTodo(todo.id)}
										disabled={isDeleting}
									>
										Удалить
									</button>
									<span>{todo.title}</span>
								</div>
							)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

export default TodoList;
