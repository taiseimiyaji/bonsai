"use client";
import type React from "react";
import { useState } from "react";

export default function ScrapForm() {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [link, setLink] = useState("");
	const [image, setImage] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Handle form submission
		console.log({ title, description, link, image });
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="max-w-4xl mx-auto p-6 bg-gray-700 text-white rounded-lg shadow-md"
			autoComplete="off"
		>
			<h1 className="text-3xl font-bold mb-6">Create a New Scrap</h1>
			<div className="mb-4">
				<label
					htmlFor="title"
					className="block text-sm font-medium text-gray-300"
				>
					Title
				</label>
				<input
					type="text"
					id="title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					className="mt-1 block w-full bg-gray-700 border-0 border-b-2 border-gray-600 focus:border-transparent focus:outline-none focus:ring-0 text-white appearance-none caret-white"
					autoComplete="off"
				/>
			</div>
			<div className="mb-4">
				<label
					htmlFor="description"
					className="block text-sm font-medium text-gray-300"
				>
					Description
				</label>
				<textarea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					className="mt-1 block w-full bg-gray-700 border-0 border-b-2 border-gray-600 focus:border-transparent focus:outline-none focus:ring-0 text-white appearance-none caret-white"
					rows={4}
					autoComplete="off"
				/>
			</div>
			<div className="mb-4">
				<label
					htmlFor="link"
					className="block text-sm font-medium text-gray-300"
				>
					Link
				</label>
				<input
					type="text"
					id="link"
					value={link}
					onChange={(e) => setLink(e.target.value)}
					className="mt-1 block w-full bg-gray-700 border-0 border-b-2 border-gray-600 focus:border-transparent focus:outline-none focus:ring-0 text-white appearance-none caret-white"
					autoComplete="off"
				/>
			</div>
			<div className="mb-4">
				<label
					htmlFor="image"
					className="block text-sm font-medium text-gray-300"
				>
					Image URL
				</label>
				<input
					type="text"
					id="image"
					value={image}
					onChange={(e) => setImage(e.target.value)}
					className="mt-1 block w-full bg-gray-700 border-0 border-b-2 border-gray-600 focus:border-transparent focus:outline-none focus:ring-0 text-white appearance-none caret-white"
					autoComplete="off"
				/>
			</div>
			<div className="flex justify-end">
				<button
					type="submit"
					className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
				>
					Create Scrap
				</button>
			</div>
		</form>
	);
}
