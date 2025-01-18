import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const soilClassImages = {
    Lixisols: "https://example.com/images/lixisols.jpg", // Replace with actual URL
    Ferralsols: "https://example.com/images/ferralsols.jpg",
    Acrisols: "https://example.com/images/acrisols.jpg",
    Cambisols: "https://example.com/images/cambisols.jpg",
    Arenosols: "https://example.com/images/arenosols.jpg",
    // Add other soil classes as needed
};

const TopSoilClassComponent = () => {
    const [soilClass, setSoilClass] = useState(null);
    const [classValue, setClassValue] = useState(null);
    const [classProbability, setClassProbability] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Extract latitude and longitude from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const lat = parseFloat(urlParams.get("lat"));
        const lon = parseFloat(urlParams.get("lon"));

        // If latitude or longitude is missing, exit early
        if (!lat || !lon) {
            setError("Latitude or longitude is missing in the URL.");
            setLoading(false);
            return;
        }

        // Fetch top soil class data from SoilGrids API
        const fetchTopSoilClass = async () => {
            try {
                const response = await fetch(
                    `https://rest.isric.org/soilgrids/v2.0/classification/query?lon=${lon}&lat=${lat}&number_classes=1`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch top soil class data.");
                }
                const data = await response.json();

                // Extract details from the response
                setSoilClass(data.wrb_class_name);
                setClassValue(data.wrb_class_value);
                setClassProbability(data.wrb_class_probability[0][1]);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTopSoilClass();
    }, []);

    if (loading) return <p>Loading top soil class...</p>;
    if (error) return <p>Error: {error}</p>;

    // Get the image URL for the soil class
    const soilClassImages = {
        Acrisols: "https://cdn.britannica.com/58/24258-004-BCCD1E3D/soil-profile-Acrisol-Brazil-surface-layer-content.jpg",
        Albeluvisols: "https://www.madrimasd.org/blogs/universo/wp-content/blogs.dir/42/files/145/albveluvisol-fuente-pedogeographia-comeniana.jpg",
        Andosols: "https://museum.isric.org/sites/default/files/isric_10006_0.jpg",
        Anthrosols: "https://www.isric.org/sites/default/files/M_Irragric_Anthrosol.jpg",
        Arenosols: "https://static.memrise.com/uploads/things/images/27670559_140314_1024_12.jpg",
        Calcisols: "https://www.isric.org/sites/default/files/Epipetric_Calcisol_USA.jpg",
        Cambisols: "https://www.isric.org/sites/default/files/S_Cn34p.jpg",
        Chernozems: "https://www.isric.org/sites/default/files/M_Chernozem1.jpg",
        Cryosols: "https://www.isric.org/sites/default/files/M_Cryic_horizon.jpg",
        Durisols: "https://www.isric.org/sites/default/files/M_Epipetric_Durisol_ZA.jpg",
        Ferralsols: "https://www.isric.org/sites/default/files/M_Ferralsols3.jpg",
        Fluvisols: "https://www.isric.org/sites/default/files/M_Fluvisol5.jpg",
        Gleysols: "https://www.isric.org/sites/default/files/M_Eutric_Gleysol_DE6.jpg",
        Gypsisols: "https://www.isric.org/sites/default/files/M_Gypsisol6.jpg",
        Histosols: "https://www.isric.org/sites/default/files/M_Ombri-Sapric_Histosol_IE.jpg",
        Kastanozems: "https://www.isric.org/sites/default/files/M_Kastanozem1.jpg",
        Leptosol: "https://www.isric.org/sites/default/files/M_Rendzic_Leptosol_DE_10.jpg",
        Lixisols: "https://www.isric.org/sites/default/files/M_Lixisols2.jpg",
        Luvisols: "https://www.isric.org/sites/default/files/Rhodic_Nitisol_NI9.jpg",
        Nitisols: "https://www.isric.org/sites/default/files/Rhodic_Nitisol_NI9.jpg",
        Phaeozems: "https://www.isric.org/sites/default/files/M_Phaeozems1.jpg",
        Planosols: "https://www.researchgate.net/profile/Stefaan-Dondeyne/publication/267969329/figure/fig5/AS:614063272886286@1523415501539/Retic-Planosol-soil-type-u-Pdc-in-Roeselare-province-of-West-Vlaanderen.png",
        Plinthosols: "https://www.isric.org/sites/default/files/M_Plinthosols2.jpg",
        Podzols: "https://www.isric.org/sites/default/files/S_Haplic_Podzol_IE2.jpg",
        Regosols: "https://en.wikipedia.org/wiki/Regosol#/media/File:Humi-Cumulicalcaric_Regosol_May_Addi_Abagie_Ethiopia.jpg",
        Solonchaks: "https://www.isric.org/sites/default/files/S_Cn14p.jpg",
        Solonetz: "https://www.isric.org/sites/default/files/solonetz2.jpg",
        Stagnosol: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Pseudogley.jpg/330px-Pseudogley.jpg",
        Technosols: "https://www.demainlaville.com/content/uploads/2021/01/3-3-redimensionne.jpg",
        Umbrisols: "https://upload.wikimedia.org/wikipedia/en/thumb/5/54/Umbrisol.jpg/300px-Umbrisol.jpg",
        Vertisols: "https://www.isric.org/sites/default/files/M_Grumi-Pellic_Vertisol_NI9.jpg",
        Default: "https://upload.wikimedia.org/wikipedia/en/thumb/5/54/Umbrisol.jpg/300px-Umbrisol.jpg",

    };

    const handleSoilClassClick = () => {
        // Navigate to the details page of the soil class
        router.push(`https://www.isric.org/explore/world-soil-distribution/${soilClass}`);
    };

    const soilImage = soilClassImages[soilClass] || "https://cdn.britannica.com/70/24270-004-5D749430/soil-profile-Fluvisol-sediments-South-Africa-rivers.jpg"; // Fallback image

    return (
        <div className="top-soil-class-container bg-yellow-500/20 p-4 rounded-2xl shadow-lg"
            onClick={handleSoilClassClick}
        >
            <h2 className="text-xl font-semibold mb-4">Top Soil Class</h2>
            <p className="text-lg"><strong>Soil Class Name:</strong> {soilClass}</p>
            <p className="text-lg"><strong>Class Value:</strong> {classValue}</p>
            <p className="text-lg"><strong>Class Probability:</strong> {classProbability}%</p>
            {soilImage && (
                <div className="mt-4">
                    <img
                        src={soilImage}
                        alt={soilClass}
                        className=" sm:w-3/4 h-auto rounded-lg shadow-md"
                    />
                </div>
            )}
        </div>
    );
};

export default TopSoilClassComponent;
