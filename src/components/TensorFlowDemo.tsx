import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import toast from 'react-hot-toast';

const TensorFlowDemo: React.FC = () => {
  const [prediction, setPrediction] = useState<number | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    const runDemo = async () => {
      // Create a simple model for y = 2x - 1
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
      model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

      // Generate some synthetic data for training
      const xs = tf.tensor2d([-1, 0, 1, 2, 3, 4], [6, 1]);
      const ys = tf.tensor2d([-3, -1, 1, 3, 5, 7], [6, 1]);

      // Train the model
      await model.fit(xs, ys, { epochs: 250 });
      setModelLoading(false);

      // Make a prediction for x = 10 (expected y = 19)
      const output = model.predict(tf.tensor2d([10], [1, 1])) as tf.Tensor;
      const data = await output.data();
      setPrediction(data[0]);
      toast.success('TensorFlow model trained and prediction generated!');
    };

    runDemo();
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 mt-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">TF</span>
        TensorFlow.js Demo
      </h2>
      <p className="text-slate-600 dark:text-gray-400 mb-4">
        Training a simple linear model (y = 2x - 1) directly in your browser.
      </p>

      {modelLoading ? (
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 italic">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          Training model...
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
          <p className="text-slate-800 dark:text-gray-200 font-medium">
            Prediction for <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">x = 10</code>:
          </p>
          <p className="text-3xl font-mono text-orange-600 dark:text-orange-500 mt-2">
            {prediction !== null ? prediction.toFixed(4) : 'Calculating...'}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Expected value: 19.00</p>
        </div>
      )}
    </div>
  );
};

export default TensorFlowDemo;
