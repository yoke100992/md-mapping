const COLOR_PALETTE = [
    '#C41E3A', '#2E8B57', '#1976D2', '#F57C00', '#7B1FA2',
    '#00796B', '#D32F2F', '#512DA8', '#0097A7', '#689F38',
    '#C2185B', '#303F9F', '#E64A19', '#5D4037', '#455A64'
];

// Fungsi: cek custom color dulu, kalau tidak ada pakai otomatis
export const getFrontlinerColor = (name, customColors = {}) => {
    if (!name) return '#999999';
    if (customColors[name]) return customColors[name];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
};

// Palet warna untuk color picker
export const COLOR_PICKER_PALETTE = [
    '#C41E3A', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548', '#607D8B', '#000000', '#FFFFFF'
];

export const RTG_LABELS = ['RTG', 'Freezer', 'Chiller', 'Display', 'None'];