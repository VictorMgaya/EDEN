'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const EditCropPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [cropData, setCropData] = React.useState({
        _id: '',
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
      const handleSearch = async () => {
          try {
              const response = await axios.get(`/api/crops?name=${searchTerm}`);
              if (response.data && response.data.length > 0) {
                  setCropData(response.data[0]); // Take the first matching crop
                  setMessage('Crop found successfully');
              } else {
                  setMessage('Crop not found');
                  setCropData({
                      name: '',
                      biologicalName: '',
                      soilClass: '',
                      avgGrowthTime: '',
                      description: '',
                      Kc: 0,
                      infosources: '',
                      imageUrl: ''
                  });
              }
          } catch (error) {
              console.error('Error searching for crop:', error);
              setMessage('Error searching for crop');
          }
      };

      const handleInputChange = (e) => {
          const { name, value, type } = e.target;
          setCropData((prevData) => ({
              ...prevData,
              [name]: type === 'number' ? Number(value) : value,
          }));
      };
      const handleSubmit = async (e) => {
          e.preventDefault();
          try {
              const response = await axios.put(`/api/admin/crops`, cropData);
              if (response.data) {
                  setMessage('Crop updated successfully!');
                  setCropData(response.data);
              }
          } catch (error) {
              console.error('Error updating crop:', error);
              setMessage('Failed to update crop: ' + error.message);
          }
      };



    return (
        <div className="container mx-auto px-4 py-8 bg-green-500/10">
            <h1 className="text-3xl text-center mb-8">Edit Crop</h1>
            {message && <div className="text-center mb-4">{message}</div>}

            <div className="mb-4 max-w-lg mx-auto">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search crop by name"
                    className="w-full px-3 py-2 border rounded"
                />
                <button 
                    onClick={handleSearch}
                    className="w-full mt-2 bg-blue-500 text-white py-2 rounded"
                >
                    Search
                </button>
            </div>

            {cropData.name && (
                <>
                    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={cropData.name}
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border rounded"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Description</label>
                            <textarea
                                name="description"
                                value={cropData.description}
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
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
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <button type="submit" className="w-full bg-green-500 text-white py-2 rounded">
                            Update Crop
                        </button>
                    </form>
                    <div className="text-center mt-4">
                        <Link href="/admin/add-crop" className="text-blue-500">
                            Add Crop
                        </Link>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2">Biological Name</label>
                        <input
                            type="text"
                            name="biologicalName"
                            value={cropData.biologicalName}
                            onChange={handleInputChange}
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
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default EditCropPage;
