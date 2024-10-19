"use client";
import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useSession } from "next-auth/react";
import { ScrapWithTimeAgo } from "@/app/api/scrapbook/[id]/route";
import {Scrap} from "@prisma/client"; // 新しい型をインポート

interface FormInputs {
	title: string;
	description: string;
	link: string;
	image: string;
}

interface ScrapFormProps {
	scrapBookId: string;
	onScrapAdded: (newScrap: ScrapWithTimeAgo) => void; // 新しいスクラップが追加された後に呼び出す関数
}

export default function ScrapForm({ scrapBookId, onScrapAdded }: ScrapFormProps) {
	const { register, handleSubmit, reset } = useForm<FormInputs>();
	const { data: session } = useSession();

	const onSubmit: SubmitHandler<FormInputs> = async (data) => {
		if (!data.title) {
			alert("Title is required");
			return;
		}

		const newScrap: ScrapWithTimeAgo = {
			id: "temp-id", // 一時的なIDを設定
			userId: '',
			title: data.title,
			content: data.description,
			link: data.link,
			image: data.image,
			ogpData: null, // 必要に応じて適切な値を設定
			scrapBookId,
			categoryId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			timeAgo: "just now",
			category: null
		};

		// ローカル状態を即座に更新
		onScrapAdded(newScrap);

		try {
			const response = await fetch('/api/scrapbook/scrap/new', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...data,
					scrapBookId, // 適切なScrapBook IDを設定
				}),
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const savedScrap: ScrapWithTimeAgo = await response.json();
			console.log('Scrap created:', savedScrap);

			// フォームをリセット
			reset();
		} catch (error) {
			console.error(error);
			alert('Failed to create Scrap');
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="max-w-4xl mx-auto p-6 bg-gray-700 text-white rounded-lg"
			autoComplete="off"
		>
			<h1 className="text-3xl font-bold mb-6">Create a New Scrap</h1>
			<div className="mb-4">
				<label
					htmlFor="title"
					className="block text-sm font-medium text-gray-300"
				>
					Title<span className="text-red-500"> *</span>
				</label>
				<input
					type="text"
					id="title"
					{...register('title', { required: true })}
					className="mt-1 block w-full bg-gray-700 border-0 border-b-2 border-gray-600 focus:border-transparent focus:outline-none focus:ring-0 text-white appearance-none caret-white"
					autoComplete="off"
					required
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
					{...register('description')}
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
					{...register('link')}
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
					{...register('image')}
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
