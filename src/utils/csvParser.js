import Papa from 'papaparse';

export const parseCSV = (file) => new Promise((resolve, reject) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.replace(/^\\uFEFF/, '').trim(),
    complete: (results) => {
      if (results.errors?.some((error) => error.code === 'TooManyFields' || error.code === 'TooFewFields')) {
        console.warn('CSV memiliki baris dengan jumlah kolom tidak konsisten:', results.errors.slice(0, 5));
      }
      const get = (row, ...names) => {
        for (const name of names) {
          const key = Object.keys(row).find((candidate) => candidate.toLowerCase().trim() === name.toLowerCase());
          if (key && row[key] != null) return String(row[key]).trim();
        }
        return '';
      };
      const data = results.data.map((row, index) => {
        const latitude = Number.parseFloat(get(row, 'Latitude', 'Lat'));
        const longitude = Number.parseFloat(get(row, 'Longitude', 'Long', 'Lng'));
        return {
          id: `csv-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
          frontliner: get(row, 'Frontliner'),
          outletId: get(row, 'Outlet ID', 'outlet_id', 'OutletID'),
          outletName: get(row, 'Outlet Name', 'outlet_name', 'OutletName'),
          city: get(row, 'City'),
          district: get(row, 'District'),
          account: get(row, 'Account'),
          latitude: Number.isFinite(latitude) ? latitude : 0,
          longitude: Number.isFinite(longitude) ? longitude : 0,
          address: get(row, 'Address', 'Adress'),
          rtgFreezer: get(row, 'RTG_Freezer', 'RTG/Freezer') || 'None',
        };
      });
      resolve(data);
    },
    error: reject,
  });
});

export const exportCSV = (data) => {
    const csv = Papa.unparse(
        data.map((d) => ({
            Frontliner: d.frontliner,
            'Outlet ID': d.outletId,
            'Outlet Name': d.outletName,
            City: d.city,
            District: d.district,
            Account: d.account,
            Latitude: d.latitude,
            Longitude: d.longitude,
            Address: d.address,
            RTG_Freezer: d.rtgFreezer,
        }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'md_mapping_data.csv');
    link.click();
    URL.revokeObjectURL(url);
};

export const downloadTemplate = () => {
    const template = [
        {
            Frontliner: 'YANAS MUHAMMAD SUPRIATNA',
            'Outlet ID': '11102376',
            'Outlet Name': 'Alfa Cisaranten Endah',
            City: 'Kota Bandung',
            District: 'Arcamanik',
            Account: 'Alfamart',
            Latitude: -6.9280617,
            Longitude: 107.67242,
            Address: 'Jl. Cingised No.83, Cisaranten Endah, Kec. Arcamanik',
            RTG_Freezer: 'RTG',
        },
    ];
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_md_mapping.csv');
    link.click();
    URL.revokeObjectURL(url);
};