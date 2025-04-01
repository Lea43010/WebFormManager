COPY public.session (sid, sess, expire) FROM stdin;
b_AQ4fqNSe8DIJM6xP9YfhESC1TBWaq-	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-08T09:40:03.406Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-04-08 10:33:15
\.


--
-- Data for Name: tblattachment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblattachment (id, project_id, file_name, file_path, file_type, file_size, description, created_at, original_name) FROM stdin;
\.


--
-- Data for Name: tblcompany; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblcompany (company_id, project_id, company_art, company_name, street, house_number, address_line_2, postal_code, city, city_part, state, country, company_phone, company_email) FROM stdin;
1	\N	\N	Stadt M	Raumerstrasse	23	\N	39922	X	\N	\N	\N	\N	le@gsl.de
2	\N	\N	fsdd	LSJFL	34	\N	20284	Haals	\N	\N	\N	49128493839	le@gsl.de
\.


--
-- Data for Name: tblcomponent; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblcomponent (id, component_id, project_id, component_name) FROM stdin;
\.


--
-- Data for Name: tblcustomer; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblcustomer (id, project_id, customer_id, street, house_number, address_line_2, postal_code, city, city_part, state, country, geodate, customer_phone, customer_email) FROM stdin;
1	\N	1	Testerstrasse	34	\N	20389	Testing	\N	\N	\N	\N	128493839	le@gsl.de
2	\N	1	Testerstrasse	34	\N	20389	Testing	\N	\N	\N	\N	128493839	le@gsl.de
3	\N	928930	Haupstrasse	23	\N	20248	Hajslf	\N	\N	\N	\N	128493839	lggj@slsl.de
\.


--
-- Data for Name: tblmaterial; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblmaterial (id, material_id, material_name, material_amount, material_price, material_total) FROM stdin;
\.


--
-- Data for Name: tblperson; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblperson (id, person_id, project_id, company_id, professional_name, firstname, lastname) FROM stdin;
\.


--
-- Data for Name: tblproject; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblproject (id, project_id, customer_id, company_id, person_id, permission, permission_name, project_cluster, project_name, project_art, project_width, project_length, project_height, project_text, project_startdate, project_enddate, project_stop, project_stopstartdate, project_stopenddate) FROM stdin;
1	\N	2	1	\N	f		Test	Test	Umbau	234.00	12.00	34.00	\N	\N	\N	f	\N	\N
\.


--
-- Data for Name: tbluser; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tbluser (id, username, password, user_name, user_email) FROM stdin;
1	leazimmer	ae717fd9fed9cf1e8243192081681cf3fdb45e362a4128418083b488979ecd107dd5326f15608cf04885773559875190de097b101a33d5f3a70328ed5bc844ec.a445df5e41edf3cb9523f8c77cfb1916	Zimmer	lea.zimmer@gmx.net
\.


--
-- Name: tblattachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblattachment_id_seq', 1, false);


--
-- Name: tblcompany_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblcompany_company_id_seq', 2, true);


--
-- Name: tblcomponent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
