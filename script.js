let plots = []; // Tanımlama için global olarak tanımlanmalıdır

// Form verilerini işleme ve plot ekleme
document.getElementById('add-plot').addEventListener('click', function() {
    const name = document.getElementById('plot-name').value || `Plot ${plots.length + 1}`;
    const gain = parseFloat(document.getElementById('gain').value);
    const numCoeffs = document.getElementById('numerator').value.split(',').map(Number);
    const denCoeffs = document.getElementById('denominator').value.split(',').map(Number);
    const freqStart = parseFloat(document.getElementById('freq-start').value);
    const freqEnd = parseFloat(document.getElementById('freq-end').value);

    const plot = {
        name,
        gain,
        numCoeffs,
        denCoeffs,
        freqStart,
        freqEnd
    };

    plots.push(plot);
    updateTransferFunctionList();
    updateTransferFunctionFormula();
});

// Grafik çizme işlemi
document.getElementById('plot-all').addEventListener('click', function() {
    drawBodePlots();
});

function updateTransferFunctionList() {
    const list = document.getElementById('transfer-function-list');
    list.innerHTML = '';

    plots.forEach((plot, index) => {
        const item = document.createElement('div');
        item.className = 'transfer-function-item';

        const text = document.createElement('span');
        text.innerHTML = `<strong>${plot.name}</strong>: \\(${generateTransferFunctionFormula(plot)}\\)`;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            plots.splice(index, 1);
            updateTransferFunctionList();
            drawBodePlots();
        });

        item.appendChild(text);
        item.appendChild(removeButton);
        list.appendChild(item);
    });

    MathJax.typesetPromise(); // MathJax'te bu fonksiyon formülleri işlemek için kullanılır
}

function generateTransferFunctionFormula(plot) {
    const numerator = plot.numCoeffs.map((coeff, index) => `${coeff}s^{${plot.numCoeffs.length - 1 - index}}`).join(' + ');
    const denominator = plot.denCoeffs.map((coeff, index) => `${coeff}s^{${plot.denCoeffs.length - 1 - index}}`).join(' + ');
    return `H(s) = ${plot.gain} \\cdot \\frac{${numerator}}{${denominator}}`;
}

function drawBodePlots() {
    const ctxMag = document.getElementById('magnitude-chart').getContext('2d');
    const ctxPhase = document.getElementById('phase-chart').getContext('2d');

    const datasetsMag = [];
    const datasetsPhase = [];

    plots.forEach((plot) => {
        const { gain, numCoeffs, denCoeffs, freqStart, freqEnd } = plot;

        const freqs = generateFreqs(freqStart, freqEnd);
        const magnitudes = [];
        const phases = [];

        freqs.forEach(freq => {
            const omega = 2 * Math.PI * freq;
            const s = math.complex(0, omega);

            const numerator = evaluatePolynomial(numCoeffs, s);
            const denominator = evaluatePolynomial(denCoeffs, s);
            const H = math.multiply(gain, math.divide(numerator, denominator));

            magnitudes.push(20 * Math.log10(math.abs(H)));
            phases.push(math.atan2(math.im(H), math.re(H)) * (180 / Math.PI));
        });

        datasetsMag.push({
            label: `${plot.name} - Magnitude`,
            data: magnitudes,
            borderColor: getRandomColor(),
            fill: false,
            pointRadius: 0 // Noktaları kaldırır
        });

        datasetsPhase.push({
            label: `${plot.name} - Phase`,
            data: phases,
            borderColor: getRandomColor(),
            fill: false,
            pointRadius: 0 // Noktaları kaldırır
        });
    });

    if (window.magnitudeChart) {
        window.magnitudeChart.destroy();
    }
    window.magnitudeChart = new Chart(ctxMag, {
        type: 'line',
        data: {
            labels: generateFreqs(plots[0].freqStart, plots[0].freqEnd),
            datasets: datasetsMag
        },
        options: {
            scales: {
                x: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Frequency (Hz)',
                        color: '#E0E0E0'
                    },
                    ticks: {
                        color: '#E0E0E0'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Magnitude (dB)',
                        color: '#E0E0E0'
                    },
                    ticks: {
                        color: '#E0E0E0'
                    }
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        drag: {
                            enabled: true
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label;
                            const freq = context.label;
                            const value = context.parsed.y;
                            return `${label}: ${value.toFixed(2)} dB at ${parseFloat(freq).toFixed(2)} Hz`;
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 2
                },
                point: {
                    radius: 0 // Görünürlüğü artırmak için noktaları gizler
                }
            },
            animation: false // Performans için animasyonları kapatır
        }
    });

    if (window.phaseChart) {
        window.phaseChart.destroy();
    }
    window.phaseChart = new Chart(ctxPhase, {
        type: 'line',
        data: {
            labels: generateFreqs(plots[0].freqStart, plots[0].freqEnd),
            datasets: datasetsPhase
        },
        options: {
            scales: {
                x: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Frequency (Hz)',
                        color: '#E0E0E0'
                    },
                    ticks: {
                        color: '#E0E0E0'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Phase (degrees)',
                        color: '#E0E0E0'
                    },
                    ticks: {
                        color: '#E0E0E0'
                    }
                }
            },
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        drag: {
                            enabled: true
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label;
                            const freq = context.label;
                            const value = context.parsed.y;
                            return `${label}: ${value.toFixed(2)}° at ${parseFloat(freq).toFixed(2)} Hz`;
                        }
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 2
                },
                point: {
                    radius: 0 // Görünürlüğü artırmak için noktaları gizler
                }
            },
            animation: false // Performans için animasyonları kapatır
        }
    });
}

function generateFreqs(start, end) {
    const freqs = [];
    for (let i = start; i <= end; i *= 1.1) {
        freqs.push(i);
    }
    return freqs;
}

function evaluatePolynomial(coeffs, s) {
    return coeffs.reduce((acc, coeff, index) => {
        return math.add(acc, math.multiply(coeff, math.pow(s, coeffs.length - 1 - index)));
    }, math.complex(0));
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
