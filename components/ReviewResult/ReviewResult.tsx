type ReviewResultProps = {
    strongPoints: string[];
    weakPoints: string[];
    recommendations: string[];
};

export default function ReviewResult({ strongPoints, weakPoints, recommendations }: ReviewResultProps) {
    return (
        <>
            {strongPoints.filter(p => p.trim()).length > 0 && (
                <div>
                    <p className="font-semibold text-green-700 mb-1">✓ Сильные стороны</p>
                    <ul className="space-y-1">
                        {strongPoints.map((p, i) => (
                            <li key={i} className="bg-green-50 rounded-lg p-2 text-gray-700">{p}</li>
                        ))}
                    </ul>
                </div>
            )}
            {weakPoints.filter(p => p.trim()).length > 0 && (
                <div>
                    <p className="font-semibold text-red-700 mb-1">✗ Слабые стороны</p>
                    <ul className="space-y-1">
                        {weakPoints.map((p, i) => (
                            <li key={i} className="bg-red-50 rounded-lg p-2 text-gray-700">{p}</li>
                        ))}
                    </ul>
                </div>
            )}
            {recommendations.filter(p => p.trim()).length > 0 && (
                <div>
                    <p className="font-semibold text-blue-700 mb-1">💡 Рекомендации</p>
                    <ul className="space-y-1">
                        {recommendations.map((p, i) => (
                            <li key={i} className="bg-blue-50 rounded-lg p-2 text-gray-700">{p}</li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
