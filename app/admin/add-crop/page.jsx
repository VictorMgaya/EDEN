'use client';

import React, { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const AddCropPage = () => {
    const [cropData, setCropData] = useState({
        name: '',
        biologicalName: '',
        soilClass: '',
        avgGrowthTime: '',
        description: '',
        Kc: '',
        infosources: '',
        imageUrl: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCropData({ ...cropData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/admin/add-crop', cropData);
            setMessage('Crop added successfully!');
            setCropData({
                name: '',
                biologicalName: '',
                soilClass: '',
                avgGrowthTime: '',
                description: '',
                Kc: '',
                infosources: '',
                imageUrl: ''
            });
        } catch (error) {
            console.error('Error adding crop:', error);
            setMessage('Failed to add crop.');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 bg-green-500/10">
            <h1 className="text-3xl text-center mb-8">Add Crop</h1>
            {message && <div className="text-center mb-4">{message}</div>}
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={cropData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Biological Name</label>
                    <input
                        type="text"
                        name="biologicalName"
                        value={cropData.biologicalName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Soil Class</label>
                    <input
                        type="text"
                        name="soilClass"
                        value={cropData.soilClass}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Average Growth Time (months)</label>
                    <input
                        type="text"
                        name="avgGrowthTime"
                        value={cropData.avgGrowthTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Description</label>
                    <textarea
                        name="description"
                        value={cropData.description}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Kc</label>
                    <input
                        type="number"
                        name="Kc"
                        value={cropData.Kc}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Info Sources</label>
                    <input
                        type="text"
                        name="infosources"
                        value={cropData.infosources}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Image URL</label>
                    <input
                        type="text"
                        name="imageUrl"
                        value={cropData.imageUrl}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded"
                    />
                </div>
                <button type="submit" className="w-full bg-green-500 text-white py-2 rounded">
                    Add Crop
                </button>
            </form>
            <div className="text-center mt-4">
                <Link href="/admin/edit-crop" className="text-blue-500">
                    Edit Crop
                </Link>
            </div>
        </div>
    );
};

export default AddCropPage;
