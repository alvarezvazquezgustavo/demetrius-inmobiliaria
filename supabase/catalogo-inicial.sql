-- =========================================================
--  Demetrius Grupo Inmobiliario — Catálogo inicial en el panel (2026-11-08)
--  Pasa al panel las 48 propiedades que estaban escritas a mano en index.html
--  (todas menos el Edificio Luviano, que tiene un diseño especial y se queda en la página).
--
--  ANTES: ejecuta la versión nueva de supabase/propiedades.sql (agrega los campos
--         "zona_texto" y "datos_tarjeta" y permite las fotos que viven en la página).
--  Ejecuta TODO este archivo en: Supabase → SQL Editor → New query → pegar → Run
--
--  Se puede volver a ejecutar: si una propiedad ya existe, no se toca (no borra ni
--  sobrescribe lo que hayas editado en el panel).
--
--  Cada propiedad conserva exactamente los textos de su tarjeta (título, etiqueta, zona,
--  datos cortos y precio) y su foto actual ("sitio/<archivo>": la foto sigue en la página).
--  Los ids son fijos: index.html y js/principal.js usan los mismos para reconocerlas.
-- =========================================================

insert into public.propiedades (
  id, estado, titulo, tipo, operacion, precio_venta, precio_renta, municipio, colonia,
  zona_texto, etiqueta, terreno_m2, construccion_m2, recamaras, banos, estacionamientos,
  amenidades, datos_tarjeta, coto, preventa, lat, lng, fotos
)
values
  -- 2. Casa en Venta · Zoi Capital Norte, Río Blanco, Zapopan
  ('1856b3dc-adb9-52bd-8921-ab5bc0bcf201', 'publicada', 'Casa en Venta', 'casa', 'venta', 3199000.0, null, 'zapopan', 'Río Blanco', 'Zoi Capital Norte, Río Blanco, Zapopan', 'Coto con Amenidades', null, 90.0, 2, 2.5, 2, '{}'::text[], array['90 m²', '2 rec.', '2.5 baños', '2 estac.']::text[], true, false, 20.785784, -103.411437, array['sitio/zoicapitalnorte.jpg']::text[]),
  -- 3. Casa En Venta · Col. Lomas de Independencia, Guadalajara
  ('60d2f40c-208e-5119-9c2e-16380f72d777', 'publicada', 'Casa En Venta', 'casa', 'venta', 4750000.0, null, 'guadalajara', 'Lomas Independencia', 'Col. Lomas de Independencia, Guadalajara', 'La mejor ubicacion', null, null, 3, 2.0, 2, '{}'::text[], array['2 estac.', '3 rec.', '2 W.C.']::text[], false, false, 20.717072912690632, -103.32776600006594, array['sitio/lomasindependenciapreguntan.jpeg']::text[]),
  -- 4. Terraza en Venta · Col. Constitución, Zapopan
  ('58a9d805-edb7-55df-b370-299fac90006a', 'publicada', 'Terraza en Venta', 'terraza', 'venta', 2800000.0, null, 'zapopan', 'Constitución', 'Col. Constitución, Zapopan', 'Para Tus Eventos', null, 93.0, null, 2.0, null, array['Area De Asador']::text[], array['93 m²', '2 W.C.', 'Area De Asador']::text[], false, false, 20.728365480919404, -103.37751172883554, array['sitio/terrza charros.jpeg']::text[]),
  -- 5. Bodega en Venta · Col. Insurgentes, Guadalajara
  ('d1f557f9-d6ea-5205-a628-b2ffe26818be', 'publicada', 'Bodega en Venta', 'bodega', 'venta', 3750000.0, null, 'guadalajara', 'Insurgentes', 'Col. Insurgentes, Guadalajara', 'Amplio Espacio', null, 295.0, null, 1.0, null, array['2 ofc.']::text[], array['295.00 m²', '2 ofc.', '1 W.C.']::text[], false, false, 20.65738913571202, -103.28536297097166, array['sitio/bodega insurgentes gris.jpeg']::text[]),
  -- 6. Departamento Punto Norte · Lomas Independencia, Guadalajara
  ('6a8bb67b-90eb-5178-91ad-fc782c728576', 'publicada', 'Departamento Punto Norte', 'departamento', 'venta', 2990000.0, null, 'guadalajara', 'Lomas Independencia', 'Lomas Independencia, Guadalajara', 'La Mejor Residencial', null, null, 3, 2.0, null, array['Seguridad 24/7']::text[], array['Seguridad 24/7', '3 rec.', '2 W.C.']::text[], true, false, 20.717159221118813, -103.3255021, array['sitio/depapuntonorte.jpeg']::text[]),
  -- 7. Casa en "Venta" · Ciudad Bugambilias, Zapopan
  ('1081eea8-4173-5267-a63b-6ffd46371355', 'publicada', 'Casa en "Venta"', 'casa', 'venta', 12000000.0, null, 'zapopan', 'Ciudad Bugambilias', 'Ciudad Bugambilias, Zapopan', '¿Espacio? De Sobra!', null, 606.0, 5, null, null, array['Terraza De 200m²']::text[], array['606.00 m²', '5 rec.', 'Terraza De 200m²']::text[], false, false, null, null, array['sitio/casabugamorada.jpeg']::text[]),
  -- 8. Terreno en Venta · Ciudad Bugambilias 2nda Sección, Zapopan
  ('60190f0d-b192-5e48-9db5-a4256cffde62', 'publicada', 'Terreno en Venta', 'terreno', 'venta', 10500000.0, null, 'zapopan', 'Ciudad Bugambilias', 'Ciudad Bugambilias 2nda Sección, Zapopan', 'Todo En Uno', 860.0, null, null, null, null, array['Area condominal', 'Vista Al Bosque']::text[], array['860.00 m²', 'Area condominal', 'Vista Al Bosque']::text[], true, false, 20.618699824026095, -103.46896374241076, array['sitio/1.jpeg']::text[]),
  -- 9. Casa en "Venta" · Ciudad Bugmbilias, Zapopan, Jalisco
  ('2cfec632-5b9d-56be-ba0b-b72e83334f2f', 'publicada', 'Casa en "Venta"', 'casa', 'venta', 12000000.0, null, 'zapopan', 'Ciudad Bugambilias', 'Ciudad Bugmbilias, Zapopan, Jalisco', 'Oportunidad de Inversión', null, 413.0, 4, null, 4, '{}'::text[], array['413 m²', '4 rec.', '4 estac.']::text[], false, false, 20.617445778259928, -103.47095443086424, array['sitio/CASA BUGA GRANDE.jpeg']::text[]),
  -- 10. Casa en "Venta" · Parques Vallarta, Zapopan
  ('d55094dd-23c3-551c-95d3-609300e8624f', 'publicada', 'Casa en "Venta"', 'casa', 'venta', 9900000.0, null, 'zapopan', 'Parques Vallarta', 'Parques Vallarta, Zapopan', 'La mejor ubicacion', null, null, 3, null, null, array['Cocina Con Cuarzo', 'Alberca']::text[], array['Cocina Con Cuarzo', '3 rec.', 'Alberca']::text[], true, false, 20.722392121213318, -103.4764693423289, array['sitio/parquesvallarta.jpeg']::text[]),
  -- 11. Departamento en "Venta" · Zapopan, La Tijera
  ('331740e9-b451-531e-ba38-50b1a1412de1', 'publicada', 'Departamento en "Venta"', 'departamento', 'venta', 3300000.0, null, 'zapopan', 'La Tijera', 'Zapopan, La Tijera', 'Torre Balanty Viva', null, null, 3, 2.0, 2, '{}'::text[], array['2 W.C.', '3 rec.', '2 estac.']::text[], false, false, 20.59056053032381, -103.43716371664033, array['sitio/depa balenty.jpeg']::text[]),
  -- 12. Casa de "Venta" · Zapopan, Jalisco
  ('6e125a49-1da8-57fc-ba0b-f466acff0836', 'publicada', 'Casa de "Venta"', 'casa', 'venta', 6980000.0, null, 'zapopan', 'Los Almendros', 'Zapopan, Jalisco', 'Los Almendros Residencial', null, null, null, 2.0, null, array['10 min. CUCEA', 'Terraza']::text[], array['10 min. CUCEA', 'Terraza', '2 W.C.']::text[], true, false, 20.766653331806882, -103.39456730008078, array['sitio/losalmendros.jpeg']::text[]),
  -- 13. Residencia Solares · Zapopan
  ('ba7e45ee-a86b-55bb-9635-d170f50923a8', 'vendida', 'Residencia Solares', 'casa', 'venta', 9400000.0, null, 'zapopan', 'Solares', 'Zapopan', 'La mejor ubicacion', null, 240.0, 3, null, null, array['Roof Garden']::text[], array['240 m²', '3 rec.', 'Roof Garden']::text[], true, false, null, null, array['sitio/residenciasolares.jpeg']::text[]),
  -- 14. Casa en Pre-Venta · Casa Fuerte, Tlajomulco de Zúñiga
  ('0f9f726f-990a-5ffc-bc50-aeaa8077f7d7', 'vendida', 'Casa en Pre-Venta', 'casa', 'venta', 5600000.0, null, 'tlajomulco', 'Casa Fuerte', 'Casa Fuerte, Tlajomulco de Zúñiga', 'Coto con Casa Club', null, 210.0, 3, 3.0, 3, '{}'::text[], array['210 m²', '3 rec.', '3 baños', '3 estac.']::text[], true, true, null, null, array['sitio/casa en pre-venta.jpg']::text[]),
  -- 15. Casa en Venta · Ciudad Bugambilias 2da Sección, Zapopan
  ('7f91456d-8653-5b3b-a472-78fbe9b46502', 'vendida', 'Casa en Venta', 'casa', 'venta', 15500000.0, null, 'zapopan', 'Ciudad Bugambilias', 'Ciudad Bugambilias 2da Sección, Zapopan', 'Propiedad en Esquina', null, 444.0, 3, 2.5, 6, '{}'::text[], array['444 m²', '3 rec.', '2.5 baños', '6 estac.']::text[], false, false, null, null, array['sitio/casa en venta cuidad bugambilias.jpg']::text[]),
  -- 16. Casa en Venta · Residencial Casa Fuerte, Tlajomulco de Zúñiga
  ('158ff379-1e2e-51f6-8436-5868658d2bd9', 'vendida', 'Casa en Venta', 'casa', 'venta', 6200000.0, null, 'tlajomulco', 'Casa Fuerte', 'Residencial Casa Fuerte, Tlajomulco de Zúñiga', 'Estrena tu Nuevo Hogar', null, 220.0, 3, 3.0, 2, '{}'::text[], array['220 m²', '3 rec.', '3 baños', '2 estac.']::text[], true, false, null, null, array['sitio/Casa en Venta, Residencial Casa Fuerte.jpg']::text[]),
  -- 17. Casa en "Venta" · Col. Mirador del Bosque, Zapopan
  ('b13cef28-26c0-505b-b9af-3d644c2d3749', 'vendida', 'Casa en "Venta"', 'casa', 'venta', 1350000.0, null, 'zapopan', 'Mirador del Bosque', 'Col. Mirador del Bosque, Zapopan', 'Estacionamiento Techado', null, 55.0, 3, 1.0, 1, '{}'::text[], array['55 m²', '3 rec.', '1 baño', '1 estac.']::text[], false, false, null, null, array['sitio/asa en Venta, Mirador del Bosque, Zapopan.jpg']::text[]),
  -- 18. Terreno en Venta · Jocotepec, Jalisco.
  ('ec9ff200-6739-5c0a-bef4-413efaca5315', 'vendida', 'Terreno en Venta', 'terreno', 'venta', 36400000.0, null, 'jocotepec', 'Jocotepec', 'Jocotepec, Jalisco.', 'Varios Lotes', 10413.0, null, null, null, null, array['Ubicado en esquina', 'Superficie plana']::text[], array['10,413 m²', 'Ubicado en esquina', 'Superficie plana']::text[], false, false, null, null, array['sitio/terrenojocotepec.jpeg']::text[]),
  -- 19. Casa en Venta / Renta · Colomos Providencia, Zapopan
  ('735d8af6-8bfb-55dd-b9f2-7e17b5314d84', 'vendida', 'Casa en Venta / Renta', 'casa', 'venta', 46900000.0, null, 'zapopan', 'Colomos Providencia', 'Colomos Providencia, Zapopan', 'Venta · Renta', null, 670.0, 4, 5.0, 10, '{}'::text[], array['670 m²', '4 rec.', '5 baños', '10 estac.']::text[], false, false, null, null, array['sitio/Casa en Venta-Renta, Colomos Providencia, Zapopan.jpg']::text[]),
  -- 20. Casa en Venta · Residencial Casa Fuerte, Tlajomulco de Zúñiga
  ('87a07f48-b1a8-55ff-9c92-3dbd236a1373', 'vendida', 'Casa en Venta', 'casa', 'venta', 6050000.0, null, 'tlajomulco', 'Casa Fuerte', 'Residencial Casa Fuerte, Tlajomulco de Zúñiga', 'Residencial Casa Fuerte', null, null, null, null, null, array['Coto con casa club', 'Alberca', 'Cochera']::text[], array['Coto con casa club', 'Alberca', 'Cochera']::text[], true, false, null, null, array['sitio/Casa en Venta, Residencial Casa Fuerte, Tlajomulco de Zuñiga.jpg']::text[]),
  -- 21. Casa en Venta · Condominio Laureles, Santa Anita, Tlajomulco
  ('d470fbea-7bc6-5cf6-b7c3-975c76b89514', 'vendida', 'Casa en Venta', 'casa', 'venta', 10800000.0, null, 'tlajomulco', 'Santa Anita', 'Condominio Laureles, Santa Anita, Tlajomulco', 'En Esquina', null, 289.0, 4, 4.5, 2, '{}'::text[], array['289 m²', '4 rec.', '4.5 baños', '2 estac.']::text[], true, false, null, null, array['sitio/Casa en Venta Coto Laureles.jpg']::text[]),
  -- 22. Casa en Pre-Venta · Residencial Casa Fuerte, Tlajomulco de Zúñiga
  ('1e9dd045-6877-5d76-8bb0-b7de4241a28f', 'vendida', 'Casa en Pre-Venta', 'casa', 'venta', 5600000.0, null, 'tlajomulco', 'Casa Fuerte', 'Residencial Casa Fuerte, Tlajomulco de Zúñiga', 'Pre-Venta', null, null, 3, 4.0, 2, array['Estudio']::text[], array['3 rec.', '4 baños', '2 estac.', 'Estudio']::text[], true, true, null, null, array['sitio/Casa en Pre-Venta, Residencial Casa Fuerte, Tlajomulco de Zuñiga Jalisco 🏡.jpg']::text[]),
  -- 23. Casa en Renta · Residencial Guadalupe, Zapopan
  ('482520cf-ef0b-5f79-985a-5a7909175499', 'rentada', 'Casa en Renta', 'casa', 'renta', null, 16000.0, 'zapopan', 'Residencial Guadalupe', 'Residencial Guadalupe, Zapopan', 'En Renta', null, 83.0, 3, 2.0, null, array['Cochera']::text[], array['83 m²', '3 rec.', '2 baños', 'Cochera']::text[], false, false, null, null, array['sitio/Casa en Renta, Residencial Guadalupe, Zapopan 🏡.jpg']::text[]),
  -- 24. Departamento en Venta · Col. La Calma, Zapopan
  ('fdfb9247-bc7e-59b5-b69e-9424bf24a07b', 'vendida', 'Departamento en Venta', 'departamento', 'venta', 2600000.0, null, 'zapopan', 'La Calma', 'Col. La Calma, Zapopan', 'Listo para Habitar', null, 60.0, 2, 1.0, 1, '{}'::text[], array['60 m²', '2 rec.', '1 baño', '1 estac.']::text[], false, false, null, null, array['sitio/Departamento en Venta, Col. La Calma, Zapopan 🏡.jpg']::text[]),
  -- 25. Casa en Venta · Parques Santa Cruz del Valle, Tlaquepaque
  ('cffe9272-0c43-531d-a2be-1ac2bc7cb0e6', 'vendida', 'Casa en Venta', 'casa', 'venta', 2100000.0, null, 'tlaquepaque', 'Santa Cruz del Valle', 'Parques Santa Cruz del Valle, Tlaquepaque', 'A 2 min. de Periférico', null, null, 2, 2.0, 2, array['Cocina equipada']::text[], array['2 rec.', '2 baños', '2 estac.', 'Cocina equipada']::text[], false, false, null, null, array['sitio/Casa en Venta, Parques Santa Cruz del Valle, Tlaquepaque.jpg']::text[]),
  -- 26. Departamento en Venta · Col. Lomas Universidad, Zapopan
  ('fb54899c-befe-5ecc-9ce5-469363525e42', 'vendida', 'Departamento en Venta', 'departamento', 'venta', 2750000.0, null, 'zapopan', 'Lomas Universidad', 'Col. Lomas Universidad, Zapopan', 'Remodelado · Planta Baja', null, 61.0, 2, 1.5, 1, '{}'::text[], array['61 m²', '2 rec.', '1.5 baños', '1 estac.']::text[], false, false, null, null, array['sitio/Departamento en Venta, Lomas Universidad, Zapopan 🏡.jpg']::text[]),
  -- 27. Casa en Venta · Zoí Sur Residencial, Tlajomulco de Zúñiga
  ('cd85dc57-36a2-54e4-9e94-b6fa1c0bef00', 'vendida', 'Casa en Venta', 'casa', 'venta', 4450000.0, null, 'tlajomulco', 'Santa Anita', 'Zoí Sur Residencial, Tlajomulco de Zúñiga', 'Nueva y Equipada', null, null, 4, 3.5, null, array['Incluye TVs y A/C']::text[], array['4 rec.', '3.5 baños', 'Incluye TVs y A/C']::text[], true, false, null, null, array['sitio/Casa en Venta, Zoí Sur Residencial, Tlajomulco de Zuñiga.jpg']::text[]),
  -- 28. Departamento en Venta · Col. La Estancia, Zapopan
  ('3cc7ce48-1b0d-5ccf-b25c-076f61d58f3b', 'vendida', 'Departamento en Venta', 'departamento', 'venta', 3250000.0, null, 'zapopan', 'La Estancia', 'Col. La Estancia, Zapopan', 'Estacionamiento Techado', null, null, 2, 1.0, 1, '{}'::text[], array['2 rec.', '1 baño', '1 estac.']::text[], false, false, null, null, array['sitio/Departamento en Venta, Col. La Estancia, Zapopan.jpg']::text[]),
  -- 29. Casa en Venta · Residencial Parque Virreyes, Zapopan
  ('cab73512-1828-5308-ad2d-86db516b8616', 'vendida', 'Casa en Venta', 'casa', 'venta', 16500000.0, null, 'zapopan', 'Virreyes Residencial', 'Residencial Parque Virreyes, Zapopan', 'Acabados de Lujo', null, null, 4, 4.0, 4, array['Doble altura']::text[], array['4 rec.', '4 baños', '4 estac.', 'Doble altura']::text[], false, false, null, null, array['sitio/Casa en Venta, Residencial Virreyes, Zapopan.jpg']::text[]),
  -- 30. Casa en Renta · Colinas de San Javier, Zapopan
  ('6d626d55-e6a6-5cda-af41-3e3d78754c10', 'rentada', 'Casa en Renta', 'casa', 'renta', null, 170000.0, 'zapopan', 'Colinas de San Javier', 'Colinas de San Javier, Zapopan', 'Se Renta Amueblada', null, null, 4, 5.0, 4, array['Alberca climatizada']::text[], array['4 rec.', '5 baños', '4 estac.', 'Alberca climatizada']::text[], false, false, null, null, array['sitio/Casa en Renta, Colinas de San Javier, Zapopan.jpg']::text[]),
  -- 31. Terreno en Venta · Bosques del Centinela, Zapopan
  ('22380770-12c7-549e-a619-37276e642b6f', 'vendida', 'Terreno en Venta', 'terreno', 'venta', 4800000.0, null, 'zapopan', 'Bosques Del Centinela', 'Bosques del Centinela, Zapopan', 'Título Ejidal', 1517.0, null, null, null, null, array['20.50 × 74 m', 'Todos los servicios']::text[], array['1,517 m²', '20.50 × 74 m', 'Todos los servicios']::text[], false, false, null, null, array['sitio/Terreno Ejidal en Venta, Bosques del Centinela, Zapopan.jpg']::text[]),
  -- 32. Departamento en Venta · Prados Guadalupe, Zapopan
  ('012e7eb6-0e64-51d3-a94a-ee3d9124aa26', 'vendida', 'Departamento en Venta', 'departamento', 'venta', 6290000.0, null, 'zapopan', 'Prados de Guadalupe', 'Prados Guadalupe, Zapopan', 'Remodelado con Lujo', null, 241.0, 3, 2.5, null, array['2 niveles']::text[], array['241 m²', '3 rec.', '2.5 baños', '2 niveles']::text[], false, false, null, null, array['sitio/Departamento en Venta, Prados Guadalupe, Zapopan.jpg']::text[]),
  -- 33. Casa en Venta · Fracc. Valle Real, Zapopan
  ('5b82fedc-5ebf-53ef-8684-48bf47d9a9b3', 'vendida', 'Casa en Venta', 'casa', 'venta', 16900000.0, null, 'zapopan', 'Valle Real', 'Fracc. Valle Real, Zapopan', 'En Esquina · Coto', null, null, 4, 4.5, 4, array['Jardín interior']::text[], array['4 rec.', '4.5 baños', '4 estac.', 'Jardín interior']::text[], true, false, null, null, array['sitio/Casa en Venta, Valle Real, Zapopan, Jalisco.jpg']::text[]),
  -- 34. Casa en Venta · Fracc. La Rioja, Tlajomulco de Zúñiga
  ('d71ceed9-0f08-54e8-9a97-3a6940f49855', 'vendida', 'Casa en Venta', 'casa', 'venta', 8920000.0, null, 'tlajomulco', 'La Rioja', 'Fracc. La Rioja, Tlajomulco de Zúñiga', 'Nueva para Estrenar', null, null, 4, 4.5, 3, array['Terraza']::text[], array['4 rec.', '4.5 baños', '3 estac.', 'Terraza']::text[], false, false, null, null, array['sitio/Casa en Venta, Fraccionamiento La Rioja, Tlajomulco de Zuñiga, Jalisco.jpg']::text[]),
  -- 35. Casa en Venta · Col. La Calma, Zapopan
  ('4666373b-302c-5903-9c58-040eed338eac', 'vendida', 'Casa en Venta', 'casa', 'venta', 5490000.0, null, 'zapopan', 'La Calma', 'Col. La Calma, Zapopan', 'Recámara en Planta Baja', null, 150.0, 3, 3.0, 2, '{}'::text[], array['150 m²', '3 rec.', '3 baños', '2 estac.']::text[], false, false, null, null, array['sitio/Casa en Venta, La Calma, Zapopan, Jalisco.jpg']::text[]),
  -- 36. Casa en Venta · Col. Agrícola, Zapopan
  ('75991967-fc6b-5c8d-a116-133edf47d628', 'vendida', 'Casa en Venta', 'casa', 'venta', 4350000.0, null, 'zapopan', 'Agrícola', 'Col. Agrícola, Zapopan', 'Cochera para 4 Autos', null, 220.0, 3, 2.0, 4, '{}'::text[], array['220 m²', '3 rec.', '2 baños', '4 estac.']::text[], false, false, null, null, array['sitio/Casa en Venta, Col. Agrícola, Zapopan.jpg']::text[]),
  -- 37. Casa en Venta · Chapalita Inn, Zapopan
  ('bc9d6471-39d4-5d91-abe8-ea9988081f30', 'vendida', 'Casa en Venta', 'casa', 'venta', 4980000.0, null, 'zapopan', 'Chapalita Inn', 'Chapalita Inn, Zapopan', 'Coto con Alberca', null, 150.0, 3, 2.5, null, array['Roof garden']::text[], array['150 m²', '3 rec.', '2.5 baños', 'Roof garden']::text[], true, false, null, null, array['sitio/Casa en Venta, Chapalita In, Zapopan, Jalisco.jpg']::text[]),
  -- 38. Casa en Venta · Ciudad Bugambilias 2da Sección, Zapopan
  ('504d9417-9336-5bc1-af25-9cff1ec9bfd8', 'vendida', 'Casa en Venta', 'casa', 'venta', 14500000.0, null, 'zapopan', 'Ciudad Bugambilias', 'Ciudad Bugambilias 2da Sección, Zapopan', 'Amueblada · Alberca', null, 1300.0, 8, 8.0, null, array['Alberca climatizada']::text[], array['1,300 m²', '8 rec.', '8 baños', 'Alberca climatizada']::text[], false, false, null, null, array['sitio/Casa en Venta, Ciudad Bugambilias, Zapopan, Jalisco.jpg']::text[]),
  -- 39. Departamento en Venta · Col. Arcos de Zapopan, Zapopan
  ('a425944d-b80e-53b8-a601-34a58ffe0f8c', 'vendida', 'Departamento en Venta', 'departamento', 'venta', 1450000.0, null, 'zapopan', 'Arcos de Zapopan', 'Col. Arcos de Zapopan, Zapopan', 'A 2 calles del Tren Ligero', null, 58.0, 2, 1.0, 1, '{}'::text[], array['58 m²', '2 rec.', '1 baño', '1 estac.']::text[], false, false, null, null, array['sitio/Departamento en Venta, Arcos de Zapopan, Jalisco.jpg']::text[]),
  -- 40. Casa en Venta · Col. Mirador del Tesoro, Tlaquepaque
  ('25fa9bd6-786c-5652-857f-c21ca8d3fec6', 'vendida', 'Casa en Venta', 'casa', 'venta', 3650000.0, null, 'tlaquepaque', 'Mirador del Tesoro', 'Col. Mirador del Tesoro, Tlaquepaque', 'A 2 calles del Tren Ligero', null, 160.0, 3, 2.5, 2, '{}'::text[], array['160 m²', '3 rec.', '2.5 baños', '2 estac.']::text[], false, false, null, null, array['sitio/Casa en Venta, Mirador del Tesoro,Tlaquepaque, Jalisco.jpg']::text[]),
  -- 41. Casa en Venta · Col. Mirador del Tesoro, Tlaquepaque
  ('680c329c-b078-55bd-a9ee-a184dfc238a3', 'vendida', 'Casa en Venta', 'casa', 'venta', 3300000.0, null, 'tlaquepaque', 'Mirador del Tesoro', 'Col. Mirador del Tesoro, Tlaquepaque', 'Cerca del Tren Ligero', null, 160.0, 3, 2.5, 2, '{}'::text[], array['160 m²', '3 rec.', '2.5 baños', '2 estac.']::text[], false, false, null, null, array['sitio/Casa en Venta, Col. Mirador del Tesoro, Tlaquepaque, Jalisco.jpg']::text[]),
  -- 42. Casa en Venta · Residencial Tres Reyes, Cajititlán
  ('f637a76f-7e34-5eb9-8cab-627d5d58cf58', 'vendida', 'Casa en Venta', 'casa', 'venta', 2850000.0, null, 'tlajomulco', 'Cajititlán', 'Residencial Tres Reyes, Cajititlán', 'Casa de Descanso', 313.0, null, 2, 2.0, null, array['Alberca']::text[], array['313 m² terreno', '2 rec.', '2 baños', 'Alberca']::text[], true, false, null, null, array['sitio/Casa en Venta, Residencial Tres Reyes, Cajititlan, Jalisco.jpg']::text[]),
  -- 43. Casa en Venta · Residencial San Miguel, Tlajomulco de Zúñiga
  ('d7e92e8b-6e85-5cd3-9834-2b92f1da85ec', 'vendida', 'Casa en Venta', 'casa', 'venta', 2250000.0, null, 'tlajomulco', 'Residencial San Miguel', 'Residencial San Miguel, Tlajomulco de Zúñiga', 'Terraza Panorámica', null, 140.0, 3, 3.5, 2, '{}'::text[], array['140 m²', '3 rec.', '3.5 baños', '2 estac.']::text[], false, false, null, null, array['sitio/Casa en Venta, Residencial San Miguel, Tlajomulco de Zuñiga.jpg']::text[]),
  -- 44. Casa en Venta · Residencial La Esmeralda, Tlajomulco de Zúñiga
  ('1e89d748-8809-50ba-946c-da77dd5e8769', 'vendida', 'Casa en Venta', 'casa', 'venta', 1250000.0, null, 'tlajomulco', 'La Esmeralda', 'Residencial La Esmeralda, Tlajomulco de Zúñiga', 'En Esquina', null, 140.0, 3, 2.0, null, array['Calentador solar']::text[], array['140 m²', '3 rec.', '2 baños', 'Calentador solar']::text[], false, false, null, null, array['sitio/Casa en Venta.jpg']::text[]),
  -- 45. Casa en Venta · Villa San Pablo, Cd. Bugambilias, Zapopan
  ('fc377ab2-7c6a-5887-aaad-e25f9d5bd2bd', 'vendida', 'Casa en Venta', 'casa', 'venta', 8499000.0, null, 'zapopan', 'Ciudad Bugambilias', 'Villa San Pablo, Cd. Bugambilias, Zapopan', 'Nueva · Recién Terminada', null, 320.0, 3, 4.5, null, array['Vista arbolada']::text[], array['320 m²', '3 rec.', '4.5 baños', 'Vista arbolada']::text[], true, false, null, null, array['sitio/Casa en Venta Ciudad Bugambilias, Zapopan.jpg']::text[]),
  -- 46. Casa en Venta · Residencial Casa Fuerte, Tlajomulco de Zúñiga
  ('145b0b1c-7c6a-53ef-9faf-d25761fb5969', 'vendida', 'Casa en Venta', 'casa', 'venta', 5500000.0, null, 'tlajomulco', 'Casa Fuerte', 'Residencial Casa Fuerte, Tlajomulco de Zúñiga', 'Nueva para Estrenar', null, 240.0, 3, 4.0, 3, '{}'::text[], array['240 m²', '3 rec.', '4 baños', '3 estac.']::text[], true, false, null, null, array['sitio/Casa en Venta, Residencial Casa Fuerte, Tlajomulco de Zuñiga (2).jpg']::text[]),
  -- 47. Casa en Venta · Sendero de las Moras, Tlajomulco de Zúñiga
  ('0428989e-2219-5ee3-b247-d0780654e0bc', 'vendida', 'Casa en Venta', 'casa', 'venta', 4050000.0, null, 'tlajomulco', 'Sendero de las Moras', 'Sendero de las Moras, Tlajomulco de Zúñiga', 'Sendero de las Moras', null, null, null, null, null, array['Cochera para 2 autos', 'Jardín frontal']::text[], array['Cochera para 2 autos', 'Jardín frontal']::text[], false, false, null, null, array['sitio/Casa en Venta Sendero de las Moras, Tlajomulco de zuñiga.jpg']::text[]),
  -- 48. Casa en Venta · Coto Los Olmos, Tlajomulco de Zúñiga
  ('01e4ea72-8884-58f7-a8a8-ccc4645ee391', 'vendida', 'Casa en Venta', 'casa', 'venta', 7950000.0, null, 'tlajomulco', 'Los Olmos', 'Coto Los Olmos, Tlajomulco de Zúñiga', 'Coto con Alberca y Gym', null, 331.0, 4, 4.0, 3, '{}'::text[], array['331 m²', '4 rec.', '4 baños', '3 estac.']::text[], true, false, null, null, array['sitio/Casa en Venta Coto los Olmos, Tlajomulco de zuñiga.jpg']::text[]),
  -- 49. Casa en Venta · Col. Paseos del Sol, Zapopan
  ('65a22e9a-962f-5eb4-af95-96cf32cdc90e', 'vendida', 'Casa en Venta', 'casa', 'venta', 5200000.0, null, 'zapopan', 'Paseos del Sol', 'Col. Paseos del Sol, Zapopan', 'Precio a Negociar', null, 215.0, 3, 3.5, null, array['Cochera']::text[], array['215 m²', '3 rec.', '3.5 baños', 'Cochera']::text[], false, false, null, null, array['sitio/Casa en Venta Paseos del Sol, Zapopan.jpg']::text[])
on conflict (id) do nothing;
