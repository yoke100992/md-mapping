# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Perbaikan performa

Versi revisi ini mengurangi beban utama aplikasi:
- Upload CSV menggunakan satu operasi multi-location Firebase, bukan satu request untuk setiap outlet.
- ID outlet dari CSV dibuat unik agar upload berikutnya tidak menimpa outlet lama.
- Pencarian peta memakai debounce 300 ms.
- Marker peta dibatasi 150 outlet per tampilan untuk menjaga responsivitas; gunakan filter untuk menemukan area/frontliner tertentu.
- Ikon marker digunakan ulang berdasarkan warna.
- Pencarian aman untuk data outlet yang kolom nama/alamatnya kosong.

Setelah menyalin proyek, jalankan `npm install` lalu `npm run dev`.
