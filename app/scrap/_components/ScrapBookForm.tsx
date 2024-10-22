"use client";
import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { trpc } from "@/app/api/trpc/trpc-client"; // tRPC クライアントをインポート

interface FormInputs {
    title: string;
    description: string;
    image: string;
    status: "PUBLIC" | "PRIVATE"; // ステータスをフォームに追加
}

export default function ScrapBookForm() {
    const { register, handleSubmit, reset } = useForm<FormInputs>();
    const router = useRouter();

    // tRPC のミューテーションを使用
    const createScrapBookMutation = trpc.scrapBook.createScrapBook.useMutation({
        onSuccess: (data) => {
            reset();
            // 作成した ScrapBook の ID を使ってページ遷移
            router.push(`/scrap/book/${data.id}`);
        },
        onError: (error) => {
            console.error('Failed to create ScrapBook:', error);
        },
    });

    const onSubmit: SubmitHandler<FormInputs> = (data) => {
        if (!data.title) {
            alert("Title is required");
            return;
        }

        createScrapBookMutation.mutate({
            title: data.title,
            description: data.description || '',
            image: data.image || '',
            status: data.status, // ステータスを送信データに含める
        });
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
            <div className="mb-4">
                <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-300"
                >
                    Status
                </label>
                <select
                    id="status"
                    {...register('status', { required: true })}
                    className="mt-1 block w-full bg-gray-700 border-0 border-b-2 border-gray-600 focus:border-transparent focus:outline-none focus:ring-0 text-white appearance-none caret-white"
                    defaultValue="PRIVATE"
                >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private</option>
                </select>
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    disabled={createScrapBookMutation.isLoading} // ローディング状態の管理
                >
                    {createScrapBookMutation.isLoading ? 'Creating...' : 'Create ScrapBook'}
                </button>
            </div>
        </form>
    );
}
