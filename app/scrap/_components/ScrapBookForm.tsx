"use client";
import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from 'next/navigation';  // 修正箇所
import { useSession } from "next-auth/react";

interface FormInputs {
    title: string;
    description: string;
    image: string;
}

export default function ScrapBookForm() {
    const { register, handleSubmit, reset } = useForm<FormInputs>();
    const router = useRouter();  // ルーターを初期化

    const onSubmit: SubmitHandler<FormInputs> = async (data) => {
        if (!data.title) {
            alert("Title is required");
            return;
        }

        try {
            const response = await fetch('/api/scrapbook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // レスポンスから作成されたScrapBookのIDを取得
            const responseData = await response.json();
            console.log('ScrapBook created:', responseData);

            const { id } = responseData;  // IDを抽出

            // フォームをリセット
            reset();

            // 作成したScrapBookのIDを使ってページ遷移
            router.push(`/scrap/book/${id}`);

        } catch (error) {
            console.error('Failed to create ScrapBook:', error);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="max-w-4xl mx-auto p-6 bg-gray-700 text-white rounded-lg"
            autoComplete="off"
        >
            <h1 className="text-3xl font-bold mb-6">Create a New ScrapBook</h1>
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
                    Create ScrapBook
                </button>
            </div>
        </form>
    );
}
