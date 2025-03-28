"use client";
import React, {useCallback, useEffect} from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { ScrapWithTimeAgo } from "@/app/types/ScrapWithTimeAgo";
import {useSession} from "next-auth/react";

interface FormInputs {
	title: string;
	content: string;
	link: string;
	image: string;
}

interface ScrapFormProps {
	scrapBookId: string;
	onScrapAdded: (newScrapData: Omit<ScrapWithTimeAgo, "id" | "timeAgo" | "createdAt" | "updatedAt" | "user">) => void;
}

export default function ScrapForm({ scrapBookId, onScrapAdded }: ScrapFormProps) {
	const { register, handleSubmit, reset, formState: { errors } } = useForm<FormInputs>();
	const { data: session } = useSession();

	const onSubmit: SubmitHandler<FormInputs> = useCallback((data) => {

		if (!session?.userId) {
			alert("Unauthorized User");
			return;
		}

		// 親コンポーネントにデータを渡す
		onScrapAdded({
			scrapBookId,
			content: data.content,
			ogpData: null, // 必要に応じて適切な値を設定
			categoryId: null,
			userId: session.userId,
			category: null,
		});

		// フォームをリセット
		reset();
	}, [onScrapAdded, scrapBookId, session, reset]);

	// Cmd + Enter で送信
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
				handleSubmit(onSubmit)();
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleSubmit, onSubmit]);

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="max-w-4xl mx-auto p-6 bg-gray-700 text-white rounded-lg"
			autoComplete="off"
		>
			<h1 className="text-3xl font-bold mb-6">Create a New Scrap</h1>
			<div className="mb-4">
				<label
					htmlFor="content"
					className="block text-sm font-medium text-gray-300"
				>
					Description
				</label>
				<textarea
					id="content"
					{...register('content', {
						required: 'Content is required',
						pattern: {
							value: /\S/,
							message: 'Content is required',
						}
					})}
					className="mt-1 block w-full bg-gray-700 border-0 border-b-2 border-gray-600 focus:border-transparent focus:outline-none focus:ring-0 text-white appearance-none caret-white"
					rows={4}
					autoComplete="off"
				/>
				{errors.content && (
					<span className="text-red-500 text-sm">{errors.content.message}</span>
				)}
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
