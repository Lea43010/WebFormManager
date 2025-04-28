--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

-- Started on 2025-04-28 06:18:01 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 935 (class 1247 OID 81921)
-- Name: analysis_types; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.analysis_types AS ENUM (
    'asphalt',
    'ground'
);


ALTER TYPE public.analysis_types OWNER TO neondb_owner;

--
-- TOC entry 974 (class 1247 OID 180225)
-- Name: bauphase_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.bauphase_type AS ENUM (
    'Baustart Tiefbau FÖB',
    'Baustart Tiefbau EWB',
    'Tiefbau EWB',
    'Tiefbau FÖB',
    'Montage NE3 EWB',
    'Montage NE3 FÖB',
    'Endmontage NE4 EWB',
    'Endmontage NE4 FÖB',
    'Sonstiges'
);


ALTER TYPE public.bauphase_type OWNER TO neondb_owner;

--
-- TOC entry 923 (class 1247 OID 65552)
-- Name: belastungsklassen; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.belastungsklassen AS ENUM (
    'Bk100',
    'Bk32',
    'Bk10',
    'Bk3.2',
    'Bk1.8',
    'Bk1.0',
    'Bk0.3',
    'unbekannt'
);


ALTER TYPE public.belastungsklassen OWNER TO neondb_owner;

--
-- TOC entry 926 (class 1247 OID 73729)
-- Name: bodenklassen; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.bodenklassen AS ENUM (
    'BK1',
    'BK2',
    'BK3',
    'BK4',
    'BK5',
    'BK6',
    'BK7',
    'unbekannt',
    'Kies',
    'Sand',
    'Lehm',
    'Ton',
    'Humus',
    'Fels',
    'Schotter'
);


ALTER TYPE public.bodenklassen OWNER TO neondb_owner;

--
-- TOC entry 929 (class 1247 OID 73746)
-- Name: bodentragfaehigkeitsklassen; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.bodentragfaehigkeitsklassen AS ENUM (
    'F1',
    'F2',
    'F3',
    'unbekannt'
);


ALTER TYPE public.bodentragfaehigkeitsklassen OWNER TO neondb_owner;

--
-- TOC entry 917 (class 1247 OID 57345)
-- Name: company_types; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.company_types AS ENUM (
    'Subunternehmen',
    'Generalunternehmen'
);


ALTER TYPE public.company_types OWNER TO neondb_owner;

--
-- TOC entry 956 (class 1247 OID 122881)
-- Name: ewb_foeb_type; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.ewb_foeb_type AS ENUM (
    'EWB',
    'FÖB',
    'EWB,FÖB',
    'keine'
);


ALTER TYPE public.ewb_foeb_type OWNER TO neondb_owner;

--
-- TOC entry 938 (class 1247 OID 90113)
-- Name: file_category_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.file_category_enum AS ENUM (
    'Verträge',
    'Rechnungen',
    'Pläne',
    'Protokolle',
    'Genehmigungen',
    'Fotos',
    'Analysen',
    'Andere'
);


ALTER TYPE public.file_category_enum OWNER TO neondb_owner;

--
-- TOC entry 962 (class 1247 OID 155649)
-- Name: login_event_types; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.login_event_types AS ENUM (
    'login',
    'logout',
    'register',
    'failed_login'
);


ALTER TYPE public.login_event_types OWNER TO neondb_owner;

--
-- TOC entry 995 (class 1247 OID 253976)
-- Name: subscription_plans; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.subscription_plans AS ENUM (
    'basic',
    'professional',
    'enterprise'
);


ALTER TYPE public.subscription_plans OWNER TO neondb_owner;

--
-- TOC entry 959 (class 1247 OID 147457)
-- Name: user_roles; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_roles AS ENUM (
    'administrator',
    'manager',
    'benutzer'
);


ALTER TYPE public.user_roles OWNER TO neondb_owner;

--
-- TOC entry 968 (class 1247 OID 163841)
-- Name: verification_types; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.verification_types AS ENUM (
    'login',
    'password_reset'
);


ALTER TYPE public.verification_types OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 259 (class 1259 OID 253965)
-- Name: email_queue; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.email_queue (
    id integer NOT NULL,
    recipient text NOT NULL,
    cc text,
    bcc text,
    subject text NOT NULL,
    text_content text,
    html_content text,
    attachments text,
    template_id text,
    template_data text,
    high_priority boolean DEFAULT false,
    metadata text,
    status text NOT NULL,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone NOT NULL,
    sent_at timestamp without time zone,
    provider text
);


ALTER TABLE public.email_queue OWNER TO neondb_owner;

--
-- TOC entry 258 (class 1259 OID 253964)
-- Name: email_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.email_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_queue_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3700 (class 0 OID 0)
-- Dependencies: 258
-- Name: email_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.email_queue_id_seq OWNED BY public.email_queue.id;


--
-- TOC entry 229 (class 1259 OID 32768)
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- TOC entry 263 (class 1259 OID 262145)
-- Name: sms_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sms_logs (
    id integer NOT NULL,
    recipient text NOT NULL,
    type text NOT NULL,
    success boolean NOT NULL,
    error_message text,
    reference text,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sms_logs OWNER TO neondb_owner;

--
-- TOC entry 262 (class 1259 OID 262144)
-- Name: sms_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sms_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sms_logs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3701 (class 0 OID 0)
-- Dependencies: 262
-- Name: sms_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sms_logs_id_seq OWNED BY public.sms_logs.id;


--
-- TOC entry 240 (class 1259 OID 98305)
-- Name: tblBedarfKapa; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."tblBedarfKapa" (
    id integer NOT NULL,
    project_id integer,
    "BedarfKapa_name" character varying(100) NOT NULL,
    "BedarfKapa_Anzahl" integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    kalenderwoche integer DEFAULT 0 NOT NULL,
    jahr integer DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL
);


ALTER TABLE public."tblBedarfKapa" OWNER TO neondb_owner;

--
-- TOC entry 239 (class 1259 OID 98304)
-- Name: tblBedarfKapa_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."tblBedarfKapa_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."tblBedarfKapa_id_seq" OWNER TO neondb_owner;

--
-- TOC entry 3702 (class 0 OID 0)
-- Dependencies: 239
-- Name: tblBedarfKapa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."tblBedarfKapa_id_seq" OWNED BY public."tblBedarfKapa".id;


--
-- TOC entry 231 (class 1259 OID 40961)
-- Name: tblattachment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblattachment (
    id integer NOT NULL,
    project_id integer,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    original_name character varying(255) NOT NULL,
    file_category public.file_category_enum,
    tags character varying(255)
);


ALTER TABLE public.tblattachment OWNER TO neondb_owner;

--
-- TOC entry 230 (class 1259 OID 40960)
-- Name: tblattachment_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblattachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblattachment_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3703 (class 0 OID 0)
-- Dependencies: 230
-- Name: tblattachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblattachment_id_seq OWNED BY public.tblattachment.id;


--
-- TOC entry 216 (class 1259 OID 24586)
-- Name: tblcompany; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblcompany (
    company_id integer NOT NULL,
    project_id integer,
    company_art public.company_types,
    company_name character varying(255),
    street character varying(255),
    house_number character varying(10),
    address_line_2 character varying(255),
    postal_code integer,
    city character varying(100),
    city_part character varying(100),
    state character varying(100),
    country character varying(100),
    company_phone text,
    company_email character varying(255)
);


ALTER TABLE public.tblcompany OWNER TO neondb_owner;

--
-- TOC entry 215 (class 1259 OID 24585)
-- Name: tblcompany_company_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblcompany_company_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblcompany_company_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3704 (class 0 OID 0)
-- Dependencies: 215
-- Name: tblcompany_company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblcompany_company_id_seq OWNED BY public.tblcompany.company_id;


--
-- TOC entry 218 (class 1259 OID 24595)
-- Name: tblcomponent; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblcomponent (
    id integer NOT NULL,
    component_id character varying(1000),
    project_id integer,
    component_name character varying(1000)
);


ALTER TABLE public.tblcomponent OWNER TO neondb_owner;

--
-- TOC entry 217 (class 1259 OID 24594)
-- Name: tblcomponent_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblcomponent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblcomponent_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3705 (class 0 OID 0)
-- Dependencies: 217
-- Name: tblcomponent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblcomponent_id_seq OWNED BY public.tblcomponent.id;


--
-- TOC entry 255 (class 1259 OID 204801)
-- Name: tblconstruction_diary; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblconstruction_diary (
    id integer NOT NULL,
    project_id integer,
    date date NOT NULL,
    employee character varying(255) NOT NULL,
    activity character varying(500) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    work_hours numeric(5,2) NOT NULL,
    material_usage character varying(500),
    remarks text,
    created_at timestamp without time zone DEFAULT now(),
    created_by integer,
    incident_type character varying(100)
);


ALTER TABLE public.tblconstruction_diary OWNER TO neondb_owner;

--
-- TOC entry 3706 (class 0 OID 0)
-- Dependencies: 255
-- Name: TABLE tblconstruction_diary; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON TABLE public.tblconstruction_diary IS 'Enthält alle Einträge des Bautagebuchs für Projekte';


--
-- TOC entry 3707 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.project_id; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.project_id IS 'Referenz zum zugehörigen Projekt';


--
-- TOC entry 3708 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.date; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.date IS 'Datum des Eintrags';


--
-- TOC entry 3709 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.employee; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.employee IS 'Name des Mitarbeiters';


--
-- TOC entry 3710 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.activity; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.activity IS 'Durchgeführte Tätigkeit';


--
-- TOC entry 3711 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.start_time; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.start_time IS 'Startzeit der Tätigkeit';


--
-- TOC entry 3712 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.end_time; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.end_time IS 'Endzeit der Tätigkeit';


--
-- TOC entry 3713 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.work_hours; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.work_hours IS 'Gesamte Arbeitsstunden (automatisch berechnet aus Start- und Endzeit oder manuell eingetragen)';


--
-- TOC entry 3714 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.material_usage; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.material_usage IS 'Verwendete Materialien';


--
-- TOC entry 3715 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.remarks; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.remarks IS 'Zusätzliche Bemerkungen';


--
-- TOC entry 3716 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.created_at; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.created_at IS 'Zeitpunkt der Erstellung des Eintrags';


--
-- TOC entry 3717 (class 0 OID 0)
-- Dependencies: 255
-- Name: COLUMN tblconstruction_diary.created_by; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.tblconstruction_diary.created_by IS 'Benutzer, der den Eintrag erstellt hat';


--
-- TOC entry 257 (class 1259 OID 212993)
-- Name: tblconstruction_diary_employees; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblconstruction_diary_employees (
    id integer NOT NULL,
    construction_diary_id integer NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    "position" character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


ALTER TABLE public.tblconstruction_diary_employees OWNER TO neondb_owner;

--
-- TOC entry 256 (class 1259 OID 212992)
-- Name: tblconstruction_diary_employees_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblconstruction_diary_employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblconstruction_diary_employees_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3718 (class 0 OID 0)
-- Dependencies: 256
-- Name: tblconstruction_diary_employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblconstruction_diary_employees_id_seq OWNED BY public.tblconstruction_diary_employees.id;


--
-- TOC entry 254 (class 1259 OID 204800)
-- Name: tblconstruction_diary_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblconstruction_diary_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblconstruction_diary_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3719 (class 0 OID 0)
-- Dependencies: 254
-- Name: tblconstruction_diary_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblconstruction_diary_id_seq OWNED BY public.tblconstruction_diary.id;


--
-- TOC entry 220 (class 1259 OID 24604)
-- Name: tblcustomer; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblcustomer (
    id integer NOT NULL,
    project_id integer,
    customer_id integer,
    street character varying(255),
    house_number character varying(10),
    address_line_2 character varying(255),
    postal_code integer,
    city character varying(100),
    city_part character varying(100),
    state character varying(100),
    country character varying(100),
    geodate character varying(255),
    customer_phone text,
    customer_email character varying(255),
    customer_type character varying(50),
    first_name character varying(100),
    last_name character varying(100),
    created_by integer
);


ALTER TABLE public.tblcustomer OWNER TO neondb_owner;

--
-- TOC entry 219 (class 1259 OID 24603)
-- Name: tblcustomer_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblcustomer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblcustomer_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3720 (class 0 OID 0)
-- Dependencies: 219
-- Name: tblcustomer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblcustomer_id_seq OWNED BY public.tblcustomer.id;


--
-- TOC entry 237 (class 1259 OID 90130)
-- Name: tblfile_organization_suggestion; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblfile_organization_suggestion (
    id integer NOT NULL,
    project_id integer NOT NULL,
    suggested_category public.file_category_enum,
    suggested_tags character varying(255),
    reason text,
    confidence numeric(5,2),
    is_applied boolean DEFAULT false,
    applied_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    file_ids text
);


ALTER TABLE public.tblfile_organization_suggestion OWNER TO neondb_owner;

--
-- TOC entry 236 (class 1259 OID 90129)
-- Name: tblfile_organization_suggestion_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblfile_organization_suggestion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblfile_organization_suggestion_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3721 (class 0 OID 0)
-- Dependencies: 236
-- Name: tblfile_organization_suggestion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblfile_organization_suggestion_id_seq OWNED BY public.tblfile_organization_suggestion.id;


--
-- TOC entry 238 (class 1259 OID 90145)
-- Name: tblfile_suggestion_attachment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblfile_suggestion_attachment (
    suggestion_id integer NOT NULL,
    attachment_id integer NOT NULL
);


ALTER TABLE public.tblfile_suggestion_attachment OWNER TO neondb_owner;

--
-- TOC entry 246 (class 1259 OID 155658)
-- Name: tbllogin_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tbllogin_logs (
    id integer NOT NULL,
    user_id integer,
    username character varying(255) NOT NULL,
    event_type public.login_event_types NOT NULL,
    ip_address character varying(45),
    user_agent character varying(500),
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    success boolean DEFAULT true,
    fail_reason text
);


ALTER TABLE public.tbllogin_logs OWNER TO neondb_owner;

--
-- TOC entry 245 (class 1259 OID 155657)
-- Name: tbllogin_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tbllogin_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbllogin_logs_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3722 (class 0 OID 0)
-- Dependencies: 245
-- Name: tbllogin_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tbllogin_logs_id_seq OWNED BY public.tbllogin_logs.id;


--
-- TOC entry 222 (class 1259 OID 24613)
-- Name: tblmaterial; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblmaterial (
    id integer NOT NULL,
    material_id character varying(1000),
    material_name integer,
    material_amount double precision,
    material_price double precision,
    material_total double precision
);


ALTER TABLE public.tblmaterial OWNER TO neondb_owner;

--
-- TOC entry 221 (class 1259 OID 24612)
-- Name: tblmaterial_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblmaterial_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblmaterial_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3723 (class 0 OID 0)
-- Dependencies: 221
-- Name: tblmaterial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblmaterial_id_seq OWNED BY public.tblmaterial.id;


--
-- TOC entry 244 (class 1259 OID 114702)
-- Name: tblmilestonedetails; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblmilestonedetails (
    id integer NOT NULL,
    milestone_id integer NOT NULL,
    kalenderwoche integer NOT NULL,
    jahr integer NOT NULL,
    text character varying(255),
    supplementary_info text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ewb_foeb public.ewb_foeb_type DEFAULT 'keine'::public.ewb_foeb_type,
    soll_menge character varying(20)
);


ALTER TABLE public.tblmilestonedetails OWNER TO neondb_owner;

--
-- TOC entry 243 (class 1259 OID 114701)
-- Name: tblmilestonedetails_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblmilestonedetails_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblmilestonedetails_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3724 (class 0 OID 0)
-- Dependencies: 243
-- Name: tblmilestonedetails_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblmilestonedetails_id_seq OWNED BY public.tblmilestonedetails.id;


--
-- TOC entry 242 (class 1259 OID 114689)
-- Name: tblmilestones; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblmilestones (
    id integer NOT NULL,
    project_id integer NOT NULL,
    name character varying(255) NOT NULL,
    start_kw integer NOT NULL,
    end_kw integer NOT NULL,
    jahr integer NOT NULL,
    color character varying(50),
    type character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ewb_foeb public.ewb_foeb_type DEFAULT 'keine'::public.ewb_foeb_type,
    soll_menge character varying(20),
    bauphase public.bauphase_type DEFAULT 'Sonstiges'::public.bauphase_type
);


ALTER TABLE public.tblmilestones OWNER TO neondb_owner;

--
-- TOC entry 241 (class 1259 OID 114688)
-- Name: tblmilestones_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblmilestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblmilestones_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3725 (class 0 OID 0)
-- Dependencies: 241
-- Name: tblmilestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblmilestones_id_seq OWNED BY public.tblmilestones.id;


--
-- TOC entry 253 (class 1259 OID 196612)
-- Name: tblpermissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblpermissions (
    id integer NOT NULL,
    project_id integer NOT NULL,
    permission_type character varying(100) NOT NULL,
    permission_authority character varying(100) NOT NULL,
    permission_date date,
    permission_notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tblpermissions OWNER TO neondb_owner;

--
-- TOC entry 251 (class 1259 OID 196608)
-- Name: tblpermissions_backup; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblpermissions_backup (
    id integer,
    project_id integer,
    permission_name character varying(100),
    permission_date date,
    created_at timestamp without time zone
);


ALTER TABLE public.tblpermissions_backup OWNER TO neondb_owner;

--
-- TOC entry 250 (class 1259 OID 188417)
-- Name: tblpermissions_old; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblpermissions_old (
    id integer NOT NULL,
    project_id integer NOT NULL,
    permission_name character varying(100) NOT NULL,
    permission_date date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tblpermissions_old OWNER TO neondb_owner;

--
-- TOC entry 249 (class 1259 OID 188416)
-- Name: tblpermissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblpermissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblpermissions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3726 (class 0 OID 0)
-- Dependencies: 249
-- Name: tblpermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblpermissions_id_seq OWNED BY public.tblpermissions_old.id;


--
-- TOC entry 252 (class 1259 OID 196611)
-- Name: tblpermissions_id_seq1; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblpermissions_id_seq1
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblpermissions_id_seq1 OWNER TO neondb_owner;

--
-- TOC entry 3727 (class 0 OID 0)
-- Dependencies: 252
-- Name: tblpermissions_id_seq1; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblpermissions_id_seq1 OWNED BY public.tblpermissions.id;


--
-- TOC entry 224 (class 1259 OID 24622)
-- Name: tblperson; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblperson (
    id integer NOT NULL,
    person_id integer,
    project_id integer,
    company_id integer,
    professional_name integer,
    firstname character varying(100),
    lastname character varying(100)
);


ALTER TABLE public.tblperson OWNER TO neondb_owner;

--
-- TOC entry 223 (class 1259 OID 24621)
-- Name: tblperson_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblperson_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblperson_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3728 (class 0 OID 0)
-- Dependencies: 223
-- Name: tblperson_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblperson_id_seq OWNED BY public.tblperson.id;


--
-- TOC entry 226 (class 1259 OID 24629)
-- Name: tblproject; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblproject (
    id integer NOT NULL,
    project_id integer,
    customer_id integer,
    company_id integer,
    person_id integer,
    permission boolean DEFAULT false,
    permission_name character varying(100),
    project_cluster character varying(255),
    project_name character varying(255),
    project_art character varying(50),
    project_width numeric(10,2),
    project_length numeric(10,2),
    project_height numeric(10,2),
    project_text integer,
    project_startdate date,
    project_enddate date,
    project_stop boolean DEFAULT false,
    project_stopstartdate date,
    project_stopenddate date,
    project_notes text,
    customer_contact_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    permission_date date
);


ALTER TABLE public.tblproject OWNER TO neondb_owner;

--
-- TOC entry 225 (class 1259 OID 24628)
-- Name: tblproject_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblproject_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblproject_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3729 (class 0 OID 0)
-- Dependencies: 225
-- Name: tblproject_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblproject_id_seq OWNED BY public.tblproject.id;


--
-- TOC entry 235 (class 1259 OID 73756)
-- Name: tblsoil_reference_data; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblsoil_reference_data (
    id integer NOT NULL,
    bodenklasse public.bodenklassen NOT NULL,
    bezeichnung character varying(255) NOT NULL,
    beschreibung text,
    korngroesse character varying(100),
    durchlaessigkeit character varying(100),
    tragfaehigkeit public.bodentragfaehigkeitsklassen,
    empfohlene_verdichtung character varying(255),
    empfohlene_belastungsklasse public.belastungsklassen,
    eigenschaften text,
    referenzbild_path character varying(1000),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tblsoil_reference_data OWNER TO neondb_owner;

--
-- TOC entry 234 (class 1259 OID 73755)
-- Name: tblsoil_reference_data_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblsoil_reference_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblsoil_reference_data_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3730 (class 0 OID 0)
-- Dependencies: 234
-- Name: tblsoil_reference_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblsoil_reference_data_id_seq OWNED BY public.tblsoil_reference_data.id;


--
-- TOC entry 261 (class 1259 OID 253984)
-- Name: tblsubscription_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblsubscription_plans (
    id integer NOT NULL,
    plan_id character varying(100) NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    "interval" character varying(20) DEFAULT 'month'::character varying NOT NULL,
    features text NOT NULL,
    stripe_price_id character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone
);


ALTER TABLE public.tblsubscription_plans OWNER TO neondb_owner;

--
-- TOC entry 260 (class 1259 OID 253983)
-- Name: tblsubscription_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblsubscription_plans_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblsubscription_plans_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3731 (class 0 OID 0)
-- Dependencies: 260
-- Name: tblsubscription_plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblsubscription_plans_id_seq OWNED BY public.tblsubscription_plans.id;


--
-- TOC entry 233 (class 1259 OID 65537)
-- Name: tblsurface_analysis; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblsurface_analysis (
    id integer NOT NULL,
    project_id integer,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    location_name character varying(255),
    street character varying(255),
    house_number character varying(10),
    postal_code character varying(10),
    city character varying(100),
    notes text,
    image_file_path character varying(1000) NOT NULL,
    visualization_file_path character varying(1000),
    belastungsklasse public.belastungsklassen NOT NULL,
    asphalttyp character varying(100),
    confidence double precision,
    analyse_details text,
    created_at timestamp without time zone DEFAULT now(),
    bodenklasse public.bodenklassen,
    bodentragfaehigkeitsklasse public.bodentragfaehigkeitsklassen,
    ground_image_file_path character varying(1000),
    ground_confidence double precision,
    ground_analyse_details text,
    analysis_type public.analysis_types DEFAULT 'asphalt'::public.analysis_types
);


ALTER TABLE public.tblsurface_analysis OWNER TO neondb_owner;

--
-- TOC entry 232 (class 1259 OID 65536)
-- Name: tblsurface_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblsurface_analysis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblsurface_analysis_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3732 (class 0 OID 0)
-- Dependencies: 232
-- Name: tblsurface_analysis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblsurface_analysis_id_seq OWNED BY public.tblsurface_analysis.id;


--
-- TOC entry 228 (class 1259 OID 24640)
-- Name: tbluser; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tbluser (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    user_name character varying(100),
    user_email character varying(255),
    role public.user_roles DEFAULT 'benutzer'::public.user_roles,
    created_by integer,
    gdpr_consent boolean DEFAULT false,
    trial_end_date date,
    subscription_status character varying(20) DEFAULT 'trial'::character varying,
    stripe_customer_id character varying(100),
    stripe_subscription_id character varying(100),
    last_payment_date date,
    subscription_plan public.subscription_plans DEFAULT 'basic'::public.subscription_plans,
    mobile_number character varying(20)
);


ALTER TABLE public.tbluser OWNER TO neondb_owner;

--
-- TOC entry 227 (class 1259 OID 24639)
-- Name: tbluser_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tbluser_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbluser_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3733 (class 0 OID 0)
-- Dependencies: 227
-- Name: tbluser_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tbluser_id_seq OWNED BY public.tbluser.id;


--
-- TOC entry 265 (class 1259 OID 270337)
-- Name: tbluser_subscriptions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tbluser_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(50) DEFAULT 'trial'::character varying,
    plan_id character varying(100),
    trial_end_date timestamp without time zone,
    last_payment_date timestamp without time zone,
    next_payment_date timestamp without time zone,
    stripe_customer_id character varying(255),
    stripe_subscription_id character varying(255),
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tbluser_subscriptions OWNER TO neondb_owner;

--
-- TOC entry 264 (class 1259 OID 270336)
-- Name: tbluser_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tbluser_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tbluser_subscriptions_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3734 (class 0 OID 0)
-- Dependencies: 264
-- Name: tbluser_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tbluser_subscriptions_id_seq OWNED BY public.tbluser_subscriptions.id;


--
-- TOC entry 248 (class 1259 OID 163846)
-- Name: tblverification_codes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tblverification_codes (
    id integer NOT NULL,
    user_id integer,
    code character varying(10) NOT NULL,
    type public.verification_types DEFAULT 'login'::public.verification_types,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    is_valid boolean DEFAULT true
);


ALTER TABLE public.tblverification_codes OWNER TO neondb_owner;

--
-- TOC entry 247 (class 1259 OID 163845)
-- Name: tblverification_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tblverification_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tblverification_codes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3735 (class 0 OID 0)
-- Dependencies: 247
-- Name: tblverification_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tblverification_codes_id_seq OWNED BY public.tblverification_codes.id;


--
-- TOC entry 3393 (class 2604 OID 253968)
-- Name: email_queue id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_queue ALTER COLUMN id SET DEFAULT nextval('public.email_queue_id_seq'::regclass);


--
-- TOC entry 3401 (class 2604 OID 262148)
-- Name: sms_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sms_logs ALTER COLUMN id SET DEFAULT nextval('public.sms_logs_id_seq'::regclass);


--
-- TOC entry 3367 (class 2604 OID 98308)
-- Name: tblBedarfKapa id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."tblBedarfKapa" ALTER COLUMN id SET DEFAULT nextval('public."tblBedarfKapa_id_seq"'::regclass);


--
-- TOC entry 3357 (class 2604 OID 40964)
-- Name: tblattachment id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblattachment ALTER COLUMN id SET DEFAULT nextval('public.tblattachment_id_seq'::regclass);


--
-- TOC entry 3343 (class 2604 OID 24589)
-- Name: tblcompany company_id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcompany ALTER COLUMN company_id SET DEFAULT nextval('public.tblcompany_company_id_seq'::regclass);


--
-- TOC entry 3344 (class 2604 OID 24598)
-- Name: tblcomponent id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcomponent ALTER COLUMN id SET DEFAULT nextval('public.tblcomponent_id_seq'::regclass);


--
-- TOC entry 3389 (class 2604 OID 204804)
-- Name: tblconstruction_diary id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblconstruction_diary ALTER COLUMN id SET DEFAULT nextval('public.tblconstruction_diary_id_seq'::regclass);


--
-- TOC entry 3391 (class 2604 OID 212996)
-- Name: tblconstruction_diary_employees id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblconstruction_diary_employees ALTER COLUMN id SET DEFAULT nextval('public.tblconstruction_diary_employees_id_seq'::regclass);


--
-- TOC entry 3345 (class 2604 OID 24607)
-- Name: tblcustomer id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcustomer ALTER COLUMN id SET DEFAULT nextval('public.tblcustomer_id_seq'::regclass);


--
-- TOC entry 3364 (class 2604 OID 90133)
-- Name: tblfile_organization_suggestion id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_organization_suggestion ALTER COLUMN id SET DEFAULT nextval('public.tblfile_organization_suggestion_id_seq'::regclass);


--
-- TOC entry 3378 (class 2604 OID 155661)
-- Name: tbllogin_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbllogin_logs ALTER COLUMN id SET DEFAULT nextval('public.tbllogin_logs_id_seq'::regclass);


--
-- TOC entry 3346 (class 2604 OID 24616)
-- Name: tblmaterial id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmaterial ALTER COLUMN id SET DEFAULT nextval('public.tblmaterial_id_seq'::regclass);


--
-- TOC entry 3375 (class 2604 OID 114705)
-- Name: tblmilestonedetails id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestonedetails ALTER COLUMN id SET DEFAULT nextval('public.tblmilestonedetails_id_seq'::regclass);


--
-- TOC entry 3371 (class 2604 OID 114692)
-- Name: tblmilestones id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestones ALTER COLUMN id SET DEFAULT nextval('public.tblmilestones_id_seq'::regclass);


--
-- TOC entry 3387 (class 2604 OID 196615)
-- Name: tblpermissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions ALTER COLUMN id SET DEFAULT nextval('public.tblpermissions_id_seq1'::regclass);


--
-- TOC entry 3385 (class 2604 OID 188420)
-- Name: tblpermissions_old id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions_old ALTER COLUMN id SET DEFAULT nextval('public.tblpermissions_id_seq'::regclass);


--
-- TOC entry 3347 (class 2604 OID 24625)
-- Name: tblperson id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblperson ALTER COLUMN id SET DEFAULT nextval('public.tblperson_id_seq'::regclass);


--
-- TOC entry 3348 (class 2604 OID 24632)
-- Name: tblproject id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblproject ALTER COLUMN id SET DEFAULT nextval('public.tblproject_id_seq'::regclass);


--
-- TOC entry 3362 (class 2604 OID 73759)
-- Name: tblsoil_reference_data id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsoil_reference_data ALTER COLUMN id SET DEFAULT nextval('public.tblsoil_reference_data_id_seq'::regclass);


--
-- TOC entry 3396 (class 2604 OID 253987)
-- Name: tblsubscription_plans id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsubscription_plans ALTER COLUMN id SET DEFAULT nextval('public.tblsubscription_plans_id_seq'::regclass);


--
-- TOC entry 3359 (class 2604 OID 65540)
-- Name: tblsurface_analysis id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsurface_analysis ALTER COLUMN id SET DEFAULT nextval('public.tblsurface_analysis_id_seq'::regclass);


--
-- TOC entry 3352 (class 2604 OID 24643)
-- Name: tbluser id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser ALTER COLUMN id SET DEFAULT nextval('public.tbluser_id_seq'::regclass);


--
-- TOC entry 3403 (class 2604 OID 270340)
-- Name: tbluser_subscriptions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.tbluser_subscriptions_id_seq'::regclass);


--
-- TOC entry 3381 (class 2604 OID 163849)
-- Name: tblverification_codes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblverification_codes ALTER COLUMN id SET DEFAULT nextval('public.tblverification_codes_id_seq'::regclass);


--
-- TOC entry 3688 (class 0 OID 253965)
-- Dependencies: 259
-- Data for Name: email_queue; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.email_queue (id, recipient, cc, bcc, subject, text_content, html_content, attachments, template_id, template_data, high_priority, metadata, status, error_message, retry_count, created_at, sent_at, provider) FROM stdin;
1	lea.zimmer@gmx.net	\N	\N	Test-Email von Bau-Structura	Dies ist eine Test-Email von der Bau-Structura App.	<p>Dies ist eine Test-Email von der Bau-Structura App.</p>	\N	\N	\N	t	{"sentBy":"leazimmer","sentFrom":"Admin-Oberfläche","testEmail":true}	sent	\N	0	2025-04-25 07:55:14.49	2025-04-25 07:56:06.462	console
6	lea.zimmer@gmx.net	\N	\N	Herzlich willkommen in der Bau-Structura App!	\nWillkommen in der Bau - Structura App!\n\nSehr geehrte Frau/Herr Lea Zimmer,\n\nherzlich willkommen bei der Bau - Structura App!\nWir freuen uns sehr, Sie als neue Nutzerin/neuen Nutzer begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und steht Ihnen ab sofort zur Verfügung.\n\nHier Ihre Zugangsdaten:\n\nBenutzername: leazimmer\nTemporäres Passwort: Landau43010#\nLogin-URL: https://bau-structura.de\n\nWichtig: Aus Sicherheitsgründen bitten wir Sie, Ihr Passwort nach der ersten Anmeldung zu ändern.\n\nEin kurzer Überblick über Ihre Möglichkeiten in der App:\n* Projektübersicht und -verwaltung\n* Bautagebuch mit automatischer Speicherung\n* Meilensteinkontrolle und Terminplanung\n* Filemanagement und Dokumentenablage\n* Oberflächenanalyse mit KI-Unterstützung\n* Bedarfs- und Kapazitätsplanung\n\nAnleitung zur Bau - Structura App: https://bau-structura.de/docs/anleitung\n\nUnser Support-Team steht Ihnen jederzeit gerne zur Verfügung, falls Sie Fragen haben oder Unterstützung benötigen.\n\nWir wünschen Ihnen viel Freude und Erfolg bei der Arbeit mit der Bau - Structura App!\n\nMit besten Grüßen,\nIhr Bau - Structura App Team\n\n---\nHinweis: Diese E-Mail wurde automatisch am 27.04.2025 generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.\n        	\n        <html>\n        <head>\n          <style>\n            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }\n            .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }\n            h1 { color: #2563eb; border-bottom: 1px solid #eee; padding-bottom: 10px; }\n            .highlight { background-color: #f4f4f4; padding: 10px; border-radius: 4px; margin: 15px 0; }\n            .credentials { font-family: Consolas, monospace; font-weight: bold; }\n            .note { font-size: 0.9em; background-color: #fdf6e3; padding: 10px; border-left: 4px solid #e5c07b; margin: 15px 0; }\n            .footer { margin-top: 30px; font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 10px; }\n            .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px; }\n            .button:hover { background-color: #1d4ed8; }\n            .feature-list { margin-top: 15px; }\n            .feature-list li { margin-bottom: 8px; }\n          </style>\n        </head>\n        <body>\n          <div class="container">\n            <h1>Willkommen in der Bau - Structura App!</h1>\n            \n            <p>Sehr geehrte Frau/Herr Lea Zimmer,</p>\n            \n            <p>herzlich willkommen bei der Bau - Structura App! Wir freuen uns sehr, Sie als neue Nutzerin/neuen Nutzer begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und steht Ihnen ab sofort zur Verfügung.</p>\n            \n            <div class="highlight">\n              <h3>Hier Ihre Zugangsdaten:</h3>\n              <p><strong>Benutzername:</strong> <span class="credentials">leazimmer</span></p>\n              <p><strong>Temporäres Passwort:</strong> <span class="credentials">Landau43010#</span></p>\n              <p><strong>Login-URL:</strong> <a href="https://bau-structura.de">https://bau-structura.de</a></p>\n            </div>\n            \n            <div class="note">\n              <p><strong>Wichtig:</strong> Aus Sicherheitsgründen bitten wir Sie, Ihr Passwort nach der ersten Anmeldung zu ändern.</p>\n            </div>\n            \n            <h3>Ein kurzer Überblick über Ihre Möglichkeiten in der App:</h3>\n            <ul class="feature-list">\n              <li>Projektübersicht und -verwaltung</li>\n              <li>Bautagebuch mit automatischer Speicherung</li>\n              <li>Meilensteinkontrolle und Terminplanung</li>\n              <li>Filemanagement und Dokumentenablage</li>\n              <li>Oberflächenanalyse mit KI-Unterstützung</li>\n              <li>Bedarfs- und Kapazitätsplanung</li>\n            </ul>\n            \n            <p>\n              <a href="https://bau-structura.de/docs/anleitung" class="button">Zur Anleitung der Bau - Structura App</a>\n            </p>\n            \n            <p>Unser Support-Team steht Ihnen jederzeit gerne zur Verfügung, falls Sie Fragen haben oder Unterstützung benötigen.</p>\n            \n            <p>Wir wünschen Ihnen viel Freude und Erfolg bei der Arbeit mit der Bau - Structura App!</p>\n            \n            <p>Mit besten Grüßen,<br>\n            Ihr Bau - Structura App Team</p>\n            \n            <div class="footer">\n              <p>Hinweis: Diese E-Mail wurde automatisch am 27.04.2025 generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.</p>\n            </div>\n          </div>\n        </body>\n        </html>\n        	\N	\N	\N	f	\N	sent	\N	0	2025-04-27 18:33:00.249	2025-04-27 18:33:55.263	brevo
2	lea.zimmer@gmx.net	\N	\N	Test-Email von Bau-Structura	Dies ist eine Test-Email von der Bau-Structura App.	<p>Dies ist eine Test-Email von der Bau-Structura App.</p>	\N	\N	\N	t	{"sentBy":"leazimmer","sentFrom":"Admin-Oberfläche","testEmail":true}	sent	\N	0	2025-04-25 07:58:25.083	2025-04-25 07:59:10.774	console
3	lea.zimmer@gmx.net	\N	\N	Test-Email von Bau-Structura	Dies ist eine Test-Email von der Bau-Structura App.	<p>Dies ist eine Test-Email von der Bau-Structura App.</p>	\N	\N	\N	t	{"sentBy":"leazimmer","sentFrom":"Admin-Oberfläche","testEmail":true}	sent	\N	0	2025-04-25 08:03:01.756	2025-04-25 08:03:10.648	console
7	lea.zimmer@gmx.net	\N	\N	Herzlich willkommen in der Bau-Structura App!	\nWillkommen in der Bau - Structura App!\n\nSehr geehrte Frau/Herr Lea Zimmer,\n\nherzlich willkommen bei der Bau - Structura App!\nWir freuen uns sehr, Sie als neue Nutzerin/neuen Nutzer begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und steht Ihnen ab sofort zur Verfügung.\n\nHier Ihre Zugangsdaten:\n\nBenutzername: leazimmer\nTemporäres Passwort: Landau43010#\nLogin-URL: https://bau-structura.de\n\nWichtig: Aus Sicherheitsgründen bitten wir Sie, Ihr Passwort nach der ersten Anmeldung zu ändern.\n\nEin kurzer Überblick über Ihre Möglichkeiten in der App:\n* Projektübersicht und -verwaltung\n* Bautagebuch mit automatischer Speicherung\n* Meilensteinkontrolle und Terminplanung\n* Filemanagement und Dokumentenablage\n* Oberflächenanalyse mit KI-Unterstützung\n* Bedarfs- und Kapazitätsplanung\n\nZur Bau - Structura App: https://bau-structura.de/\n\nUnser Support-Team steht Ihnen jederzeit gerne zur Verfügung, falls Sie Fragen haben oder Unterstützung benötigen.\n\nWir wünschen Ihnen viel Freude und Erfolg bei der Arbeit mit der Bau - Structura App!\n\nMit besten Grüßen,\nIhr Bau - Structura App Team\n\n---\nHinweis: Diese E-Mail wurde automatisch am 27.04.2025 generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.\n        	\n        <html>\n        <head>\n          <style>\n            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }\n            .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }\n            h1 { color: #2563eb; border-bottom: 1px solid #eee; padding-bottom: 10px; }\n            .highlight { background-color: #f4f4f4; padding: 10px; border-radius: 4px; margin: 15px 0; }\n            .credentials { font-family: Consolas, monospace; font-weight: bold; }\n            .note { font-size: 0.9em; background-color: #fdf6e3; padding: 10px; border-left: 4px solid #e5c07b; margin: 15px 0; }\n            .footer { margin-top: 30px; font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 10px; }\n            .button { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px; }\n            .button:hover { background-color: #1d4ed8; }\n            .feature-list { margin-top: 15px; }\n            .feature-list li { margin-bottom: 8px; }\n          </style>\n        </head>\n        <body>\n          <div class="container">\n            <h1>Willkommen in der Bau - Structura App!</h1>\n            \n            <p>Sehr geehrte Frau/Herr Lea Zimmer,</p>\n            \n            <p>herzlich willkommen bei der Bau - Structura App! Wir freuen uns sehr, Sie als neue Nutzerin/neuen Nutzer begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und steht Ihnen ab sofort zur Verfügung.</p>\n            \n            <div class="highlight">\n              <h3>Hier Ihre Zugangsdaten:</h3>\n              <p><strong>Benutzername:</strong> <span class="credentials">leazimmer</span></p>\n              <p><strong>Temporäres Passwort:</strong> <span class="credentials">Landau43010#</span></p>\n              <p><strong>Login-URL:</strong> <a href="https://bau-structura.de">https://bau-structura.de</a></p>\n            </div>\n            \n            <div class="note">\n              <p><strong>Wichtig:</strong> Aus Sicherheitsgründen bitten wir Sie, Ihr Passwort nach der ersten Anmeldung zu ändern.</p>\n            </div>\n            \n            <h3>Ein kurzer Überblick über Ihre Möglichkeiten in der App:</h3>\n            <ul class="feature-list">\n              <li>Projektübersicht und -verwaltung</li>\n              <li>Bautagebuch mit automatischer Speicherung</li>\n              <li>Meilensteinkontrolle und Terminplanung</li>\n              <li>Filemanagement und Dokumentenablage</li>\n              <li>Oberflächenanalyse mit KI-Unterstützung</li>\n              <li>Bedarfs- und Kapazitätsplanung</li>\n            </ul>\n            \n            <p>\n              <a href="https://bau-structura.de/" class="button">Zur Bau - Structura App</a>\n            </p>\n            \n            <p>Unser Support-Team steht Ihnen jederzeit gerne zur Verfügung, falls Sie Fragen haben oder Unterstützung benötigen.</p>\n            \n            <p>Wir wünschen Ihnen viel Freude und Erfolg bei der Arbeit mit der Bau - Structura App!</p>\n            \n            <p>Mit besten Grüßen,<br>\n            Ihr Bau - Structura App Team</p>\n            \n            <div class="footer">\n              <p>Hinweis: Diese E-Mail wurde automatisch am 27.04.2025 generiert. Bitte antworten Sie nicht direkt auf diese Nachricht.</p>\n            </div>\n          </div>\n        </body>\n        </html>\n        	\N	\N	\N	f	\N	sent	\N	0	2025-04-27 18:59:33.882	2025-04-27 19:00:07.941	brevo
5	lea.zimmer@gmx.net	\N	\N	Willkommen bei Bau-Structura App - Ihre Zugangsdaten	\nWillkommen bei Bau - Structura App\n\nSehr geehrter Herr Lea Zimmer,\n\nwir freuen uns, Sie als neuen Benutzer der Bau - Structura App begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und ist ab sofort einsatzbereit.\n\nIhre Zugangsdaten:\n- Benutzername: leazimmer\n- Temporäres Passwort: Landau43010#\n- Login-URL: https://bau-structura.de\n\nWichtig: Bitte ändern Sie aus Sicherheitsgründen Ihr Passwort nach der ersten Anmeldung.\n\nDie wichtigsten Funktionen im Überblick:\n* Projektübersicht und -verwaltung\n* Bautagebuch mit automatischer Speicherung\n* Meilensteinkontrolle und Terminplanung\n* Filemanagement und Dokumentenablage\n* Oberflächenanalyse mit KI-Unterstützung\n* Bedarfs- und Kapazitätsplanung\n\nSollten Sie Fragen zur Nutzung der Anwendung haben oder auf Probleme stoßen, steht Ihnen unser Support-Team gerne zur Verfügung.\n\nWir wünschen Ihnen viel Erfolg bei der Nutzung der Bau - Structura App!\n\nMit freundlichen Grüßen,\nIhr Bau - Structura App Team\n\n---\nDiese E-Mail wurde am 27.04.2025 automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.\n        	\n        <html>\n        <head>\n          <style>\n            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }\n            .container { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }\n            h1 { color: #2563eb; border-bottom: 1px solid #eee; padding-bottom: 10px; }\n            .highlight { background-color: #f4f4f4; padding: 10px; border-radius: 4px; margin: 15px 0; }\n            .credentials { font-family: Consolas, monospace; font-weight: bold; }\n            .note { font-size: 0.9em; background-color: #fdf6e3; padding: 10px; border-left: 4px solid #e5c07b; margin: 15px 0; }\n            .footer { margin-top: 30px; font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 10px; }\n          </style>\n        </head>\n        <body>\n          <div class="container">\n            <h1>Willkommen bei Bau - Structura App</h1>\n            \n            <p>Sehr geehrter Herr Lea Zimmer,</p>\n            \n            <p>wir freuen uns, Sie als neuen Benutzer der Bau - Structura App begrüßen zu dürfen. Ihr Konto wurde erfolgreich eingerichtet und ist ab sofort einsatzbereit.</p>\n            \n            <div class="highlight">\n              <h3>Ihre Zugangsdaten:</h3>\n              <p><strong>Benutzername:</strong> <span class="credentials">leazimmer</span></p>\n              <p><strong>Temporäres Passwort:</strong> <span class="credentials">Landau43010#</span></p>\n              <p><strong>Login-URL:</strong> <a href="https://bau-structura.de">https://bau-structura.de</a></p>\n            </div>\n            \n            <div class="note">\n              <p><strong>Wichtig:</strong> Bitte ändern Sie aus Sicherheitsgründen Ihr Passwort nach der ersten Anmeldung.</p>\n            </div>\n            \n            <h3>Die wichtigsten Funktionen im Überblick:</h3>\n            <ul>\n              <li>Projektübersicht und -verwaltung</li>\n              <li>Bautagebuch mit automatischer Speicherung</li>\n              <li>Meilensteinkontrolle und Terminplanung</li>\n              <li>Filemanagement und Dokumentenablage</li>\n              <li>Oberflächenanalyse mit KI-Unterstützung</li>\n              <li>Bedarfs- und Kapazitätsplanung</li>\n            </ul>\n            \n            <p>Sollten Sie Fragen zur Nutzung der Anwendung haben oder auf Probleme stoßen, steht Ihnen unser Support-Team gerne zur Verfügung.</p>\n            \n            <p>Wir wünschen Ihnen viel Erfolg bei der Nutzung der Bau - Structura App!</p>\n            \n            <p>Mit freundlichen Grüßen,<br>\n            Ihr Bau - Structura App Team</p>\n            \n            <div class="footer">\n              <p>Diese E-Mail wurde am 27.04.2025 automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>\n            </div>\n          </div>\n        </body>\n        </html>\n        	\N	\N	\N	f	\N	sent	\N	0	2025-04-27 17:52:26.703	2025-04-27 17:52:38.539	brevo
\.


--
-- TOC entry 3658 (class 0 OID 32768)
-- Dependencies: 229
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
rhLzkJAGWmfA-TbFTmFJoukHZVI8BBXr	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-30T11:11:23.126Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-01 06:00:11
R786hqWiWyoaNZNbVoJGaz1gy2tcq5xP	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-04T11:50:19.819Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":16}}	2025-05-04 16:48:40
cgSqfOmfWw8T2ycHjxhxIAn3Kqf8rPwz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-01T14:59:27.334Z","secure":true,"httpOnly":true,"path":"/"}}	2025-05-04 20:48:05
-T0ojfLjJU7yR1Zfay-cGxpBLw9jR6X8	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-28T16:10:08.075Z","secure":false,"httpOnly":true,"path":"/"}}	2025-04-28 16:10:09
4Mk7DJm7VAAZGaj1tTYHA9lwGsW2vh6c	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-30T08:37:22.215Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":9}}	2025-05-02 18:29:48
2N-OdLpCsBzjOfNE0rJqlWM7h98CVFD0	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-04T09:46:08.707Z","secure":true,"httpOnly":true,"path":"/"},"passport":{}}	2025-05-04 12:08:36
33VuWJBLdpRLhqTSxSczD-4Pl7c9I3t_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-04T07:06:52.572Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-04 07:06:53
uX0rSLOEexjtD-8VgYk_SLyqZTVjmGe_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-29T11:03:45.095Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-02 05:57:49
O99wR1PHGgFx6GiyO5TlheAynzjE7Dep	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-30T19:53:56.444Z","secure":true,"httpOnly":true,"path":"/"}}	2025-05-01 14:49:58
7BZxVyStQgX0TZ9fMgXoS_2VMTzr5iLG	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-29T14:13:23.339Z","secure":true,"httpOnly":true,"path":"/"}}	2025-04-29 14:13:24
q9bjB73jJvMwWLqTrNpF-8H1yAYzkcQz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-04T07:48:45.843Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-04 19:38:59
6Nvd2jrZLeNjgObXQg5C5kIAAB1Wn6Fy	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-29T07:42:31.369Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-04-29 07:42:32
4UaBRahxFMcP2ChSzTSN9Rr7thMrAGxA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-03T08:55:56.533Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-03 12:48:22
UMkfZ0yeFLJxU_3GXE65X_TdS6EB9WAA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-04T11:15:38.851Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-04 11:29:54
Tl29ZYT1KCwvKqfpv_uU8cmxniYZMdfV	{"cookie":{"originalMaxAge":604800000,"expires":"2025-04-29T13:44:25.833Z","secure":true,"httpOnly":true,"path":"/"}}	2025-04-29 13:44:28
YhXFK1unJanH1UuGhnP7eAAWqTKa6pa6	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-04T14:53:57.158Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-05 04:45:26
fjaInt_i7AZOqa4_4kISg1zcGzvnPYxn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-04T07:20:49.521Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-04 07:20:50
E_oyQ0Mv9OxVmFwOdU4Jmq17LtMNdYNa	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-04T13:28:29.299Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":1}}	2025-05-05 06:14:28
tdNBl0avd-uiPbPsMnJBbuJKnSeT4tgA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-04T08:09:00.671Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":15}}	2025-05-04 09:35:52
\.


--
-- TOC entry 3692 (class 0 OID 262145)
-- Dependencies: 263
-- Data for Name: sms_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sms_logs (id, recipient, type, success, error_message, reference, "timestamp") FROM stdin;
1	+4915233531845	password_reset	t	\N	1	2025-04-27 07:06:42.165268
2	+4915233531845	password_reset	t	\N	1	2025-04-27 07:13:42.628832
3	+4915233531845	notification	t	\N	test-sms	2025-04-27 08:07:55.85847
4	+4915233531845	notification	f	Request failed with status code 401	real-test-sms	2025-04-27 08:08:29.910009
\.


--
-- TOC entry 3669 (class 0 OID 98305)
-- Dependencies: 240
-- Data for Name: tblBedarfKapa; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."tblBedarfKapa" (id, project_id, "BedarfKapa_name", "BedarfKapa_Anzahl", created_at, kalenderwoche, jahr) FROM stdin;
2	2	Endmontage NE3	2	2025-04-18 09:23:24.841438	0	2025
3	2	HSA Tiefbau	1	2025-04-18 09:24:19.874588	0	2025
4	2	Endmontage NE3	3	2025-04-18 09:57:25.371005	6	2025
\.


--
-- TOC entry 3660 (class 0 OID 40961)
-- Dependencies: 231
-- Data for Name: tblattachment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblattachment (id, project_id, file_name, file_path, file_type, file_size, description, created_at, original_name, file_category, tags) FROM stdin;
13	5	Baustellen-Karte_2025-04-23_11-19-22.pdf	/home/runner/workspace/uploads/file-1745418020836-491870724.pdf	pdf	480625	\N	2025-04-23 14:20:20.925085	Baustellen-Karte_2025-04-23_11-19-22.pdf	Pläne	\N
\.


--
-- TOC entry 3645 (class 0 OID 24586)
-- Dependencies: 216
-- Data for Name: tblcompany; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblcompany (company_id, project_id, company_art, company_name, street, house_number, address_line_2, postal_code, city, city_part, state, country, company_phone, company_email) FROM stdin;
3	0	Generalunternehmen	Müller GmbH	Haupstraße	19		10115	Berlin			Deutschland	\N	info@mueller.de
4	0	Subunternehmen	Schneider AG	Bahnhofstrasse	97		20095	Hamburg			Deutschland	\N	info@schneider.de
5	0	Subunternehmen	Gerster & Co. KG	Gartenweg	1		80331	München			Deutschland	\N	info@gerster.de
6	0	Generalunternehmen	Sachverständigenbüro - Justitia	Oberdorfstraße	14		97225	Zellingen	Zellingen		Deutschland	01714408193	alexander_eisenmann@t-online.de
7	0	Generalunternehmen	Sachverständigenbüro - Justitia	Oberdorfstraße	14		97225	Zellingen	Zellingen		Deutschland	01714408193	info@sachverstaendigenbuero-justitia.com
8	0	Generalunternehmen	Sachverständigenbüro - Justitia	Oberdorfstraße	14		97225	Zellingen	Zellingen		Deutschland	01714408193	info@sachverstaendigenbuero-justitia.com
\.


--
-- TOC entry 3647 (class 0 OID 24595)
-- Dependencies: 218
-- Data for Name: tblcomponent; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblcomponent (id, component_id, project_id, component_name) FROM stdin;
\.


--
-- TOC entry 3684 (class 0 OID 204801)
-- Dependencies: 255
-- Data for Name: tblconstruction_diary; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblconstruction_diary (id, project_id, date, employee, activity, start_time, end_time, work_hours, material_usage, remarks, created_at, created_by, incident_type) FROM stdin;
1	2	2025-04-21	Endmontage NE3	Bauarbeiter	08:00:00	16:00:00	8.00		Maschinen	2025-04-21 14:18:06.831055	1	Verluste
\.


--
-- TOC entry 3686 (class 0 OID 212993)
-- Dependencies: 257
-- Data for Name: tblconstruction_diary_employees; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblconstruction_diary_employees (id, construction_diary_id, first_name, last_name, "position", created_at, created_by) FROM stdin;
\.


--
-- TOC entry 3649 (class 0 OID 24604)
-- Dependencies: 220
-- Data for Name: tblcustomer; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblcustomer (id, project_id, customer_id, street, house_number, address_line_2, postal_code, city, city_part, state, country, geodate, customer_phone, customer_email, customer_type, first_name, last_name, created_by) FROM stdin;
6	\N	1	Lindenstrasse	78	\N	50667	Köln			Deutschland	\N	06736346469	anna.schmidt@schmidt-versicherung.de	Gewerbe	Anna	Schmidt	\N
7	\N	2	Kirchweg	24	\N	70173	Stuttgart			Deutschland	\N	02111261375	lukas.meier@online.de	Privatkunde	Lukas	Meier	\N
8	\N	3	An den Riedwiesen		\N	97225	Zellingen	Schützengesellschaft 1963 Zellingen e.V.		Deutschland	\N	\N		Privatkunde	Michael	Koblinger	\N
\.


--
-- TOC entry 3666 (class 0 OID 90130)
-- Dependencies: 237
-- Data for Name: tblfile_organization_suggestion; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblfile_organization_suggestion (id, project_id, suggested_category, suggested_tags, reason, confidence, is_applied, applied_at, created_at, file_ids) FROM stdin;
\.


--
-- TOC entry 3667 (class 0 OID 90145)
-- Dependencies: 238
-- Data for Name: tblfile_suggestion_attachment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblfile_suggestion_attachment (suggestion_id, attachment_id) FROM stdin;
\.


--
-- TOC entry 3675 (class 0 OID 155658)
-- Dependencies: 246
-- Data for Name: tbllogin_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tbllogin_logs (id, user_id, username, event_type, ip_address, user_agent, "timestamp", success, fail_reason) FROM stdin;
1	1	leazimmer	logout	10.83.0.143	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:15:02.021314	t	\N
2	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:15:08.099154	t	\N
3	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:15:10.652614	t	\N
4	1	leazimmer	logout	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:22:31.616928	t	\N
5	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:26:28.259652	t	\N
6	1	leazimmer	logout	10.83.8.24	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 17:26:44.527843	t	\N
7	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:23:35.950277	t	\N
8	1	leazimmer	login	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:23:38.805706	t	\N
9	1	leazimmer	logout	10.83.2.83	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:23:51.493266	t	\N
10	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:24:01.31822	t	\N
11	1	leazimmer	logout	10.83.0.143	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-18 18:28:35.357436	t	\N
12	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 06:47:48.970063	t	\N
13	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 06:48:27.221213	t	\N
14	1	leazimmer	logout	10.83.2.46	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 07:06:13.986722	t	\N
15	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 10:42:36.86779	t	\N
16	1	leazimmer	logout	10.83.5.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 11:28:09.829707	t	\N
17	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 11:58:24.111073	t	\N
18	1	leazimmer	logout	10.83.5.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 12:15:35.081478	t	\N
19	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 12:27:56.965687	t	\N
20	1	leazimmer	login	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 12:28:00.326942	t	\N
21	1	leazimmer	logout	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 17:47:16.599314	t	\N
22	1	leazimmer	login	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 17:47:40.294024	t	\N
23	1	leazimmer	logout	10.83.4.3	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 19:10:25.749518	t	\N
24	1	leazimmer	login	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 19:10:33.599682	t	\N
25	1	leazimmer	login	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-19 19:10:35.824616	t	\N
26	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:18:16.514804	t	\N
27	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:25:21.007976	t	\N
28	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:25:23.325743	t	\N
29	1	leazimmer	logout	10.83.3.105	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:30:00.132982	t	\N
30	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:50:20.115071	t	\N
31	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 05:50:23.995804	t	\N
32	1	leazimmer	logout	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 06:01:19.175319	t	\N
33	1	leazimmer	login	10.83.3.105	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 06:02:21.968778	t	\N
34	1	leazimmer	login	10.83.3.105	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 06:02:29.574699	t	\N
35	1	leazimmer	logout	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 09:12:35.977995	t	\N
36	1	leazimmer	login	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 09:14:48.409953	t	\N
37	1	leazimmer	logout	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 09:15:15.925103	t	\N
39	1	leazimmer	login	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 09:18:57.136841	t	\N
40	1	leazimmer	logout	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:07:47.358851	t	\N
41	1	leazimmer	login	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:07:59.495641	t	\N
42	1	leazimmer	login	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:13:05.189352	t	\N
43	1	leazimmer	login	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:17:03.522353	t	\N
44	1	leazimmer	login	10.83.5.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:17:35.954107	t	\N
45	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:17:46.142933	t	\N
46	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:23:21.896205	t	\N
47	1	leazimmer	logout	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:27:59.431922	t	\N
48	1	leazimmer	login	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:28:08.837758	t	\N
49	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:28:47.397592	t	\N
50	1	leazimmer	login	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 11:39:27.042666	t	\N
51	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 12:47:19.022032	t	\N
52	1	leazimmer	login	10.83.9.34	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 12:47:25.726211	t	\N
53	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 13:19:07.528167	t	\N
54	1	leazimmer	login	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 13:19:15.101923	t	\N
55	1	leazimmer	logout	10.83.6.19	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 15:19:31.494665	t	\N
56	1	leazimmer	login	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-20 15:19:41.886516	t	\N
57	1	leazimmer	logout	10.83.7.17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 08:29:16.248297	t	\N
62	1	leazimmer	login	10.83.3.105	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 09:59:05.09253	t	\N
63	1	leazimmer	logout	10.83.11.29	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 10:11:48.930605	t	\N
64	1	leazimmer	login	10.83.4.32	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 13:06:10.887574	t	\N
65	1	leazimmer	logout	10.83.6.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 13:14:47.118753	t	\N
66	1	leazimmer	login	10.83.5.25	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 13:14:53.562336	t	\N
67	1	leazimmer	logout	10.83.11.239	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 15:33:43.547721	t	\N
68	1	leazimmer	login	10.83.6.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 15:33:51.10743	t	\N
69	1	leazimmer	logout	10.83.8.108	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 16:10:08.135478	t	\N
70	1	leazimmer	logout	10.83.5.25	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 16:10:09.449851	t	\N
71	1	leazimmer	login	10.83.8.108	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 16:10:14.67033	t	\N
72	1	leazimmer	logout	10.83.7.48	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 16:20:55.79669	t	\N
73	1	leazimmer	login	10.83.2.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 16:21:02.495444	t	\N
74	1	leazimmer	logout	10.83.0.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 17:27:43.142809	t	\N
75	1	leazimmer	login	10.83.3.131	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 17:27:49.846358	t	\N
76	1	leazimmer	logout	10.83.4.45	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 17:51:17.555502	t	\N
77	1	leazimmer	login	10.83.4.45	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 17:51:23.701086	t	\N
78	1	leazimmer	logout	10.83.3.131	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 21:10:10.169674	t	\N
81	1	leazimmer	login	10.83.8.108	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 21:23:42.87647	t	\N
82	1	leazimmer	logout	10.83.8.108	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-21 21:24:07.115392	t	\N
89	1	leazimmer	login	10.83.6.22	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 07:23:40.586929	t	\N
90	8	rkuisle	login	127.0.0.1	curl/8.11.1	2025-04-22 07:42:31.517944	t	\N
91	\N	leazimmer	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 11:03:31.888457	f	Ungültiger Benutzername oder Passwort
92	\N	leazimmer	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 11:03:33.381857	f	Ungültiger Benutzername oder Passwort
93	1	leazimmer	login	35.188.87.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 11:03:45.217482	t	\N
94	9	aeisenmann	login	35.188.87.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 13:38:41.527239	t	\N
95	9	aeisenmann	login	35.193.50.36	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36	2025-04-22 13:43:47.085243	t	\N
96	9	aeisenmann	logout	34.10.58.214	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36	2025-04-22 13:44:25.917955	t	\N
97	9	aeisenmann	logout	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 14:13:23.376796	t	\N
98	9	aeisenmann	login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 14:13:31.174183	t	\N
99	9	aeisenmann	logout	35.202.5.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 15:27:17.735281	t	\N
100	1	leazimmer	logout	10.83.3.131	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 16:48:14.447042	t	\N
103	1	leazimmer	login	10.83.11.63	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-22 20:01:54.333837	t	\N
104	9	aeisenmann	login	34.46.100.90	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-23 06:40:12.354563	t	\N
105	9	aeisenmann	logout	34.44.94.57	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-23 06:40:36.863324	t	\N
106	9	aeisenmann	login	35.202.5.198	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-23 08:09:31.940932	t	\N
107	9	aeisenmann	logout	34.68.1.153	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-23 08:11:28.096507	t	\N
108	9	aeisenmann	login	34.44.94.57	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-23 08:37:22.293312	t	\N
109	9	aeisenmann	login	35.188.87.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 09:17:10.175653	t	\N
110	1	leazimmer	login	34.44.94.57	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-23 11:11:23.237537	t	\N
111	9	aeisenmann	logout	35.202.5.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 13:00:54.45732	t	\N
112	9	aeisenmann	login	35.193.50.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 13:03:53.773314	t	\N
113	9	aeisenmann	logout	35.202.5.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 13:04:21.389008	t	\N
114	9	aeisenmann	login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 14:18:02.239294	t	\N
115	9	aeisenmann	logout	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 14:21:25.492327	t	\N
116	9	aeisenmann	login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 14:21:28.473694	t	\N
117	9	aeisenmann	logout	34.10.58.214	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 14:22:35.471092	t	\N
118	9	aeisenmann	login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 14:23:37.794821	t	\N
119	1	leazimmer	login	35.193.50.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 17:21:07.089548	t	\N
120	9	aeisenmann	logout	34.10.58.214	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:53:56.526794	t	\N
144	1	leazimmer	logout	10.83.1.68	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:05:07.422205	t	\N
121	\N	aeisenmann	failed_login	35.202.5.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:53:59.780652	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
122	\N	aeisenmann	failed_login	34.68.1.153	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:54:01.005371	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
123	\N	aeisenmann	failed_login	35.193.50.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:54:03.778604	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
124	\N	aeisenmann	failed_login	34.68.1.153	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:54:05.019763	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
125	\N	aeisenmann	failed_login	34.10.58.214	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:54:14.653628	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
126	\N	aeisenmann	failed_login	35.193.50.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:54:15.830004	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
127	\N	aeisenmann	failed_login	35.193.50.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:54:50.429208	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
128	\N	aeisenmann	failed_login	35.202.5.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:54:51.611702	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
129	\N	aeisenmann	failed_login	35.202.5.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:55:00.88395	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
130	\N	aeisenmann	failed_login	35.193.50.36	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-23 19:55:02.083626	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
131	1	leazimmer	login	34.68.1.153	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-24 06:00:59.610718	t	\N
132	\N	aeisenmann	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:00:27.346236	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
133	\N	aeisenmann	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:00:28.602044	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
134	\N	aeisenmann	failed_login	34.30.141.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:00:44.070348	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
135	\N	aeisenmann	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:00:45.267405	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
136	\N	aeisenmann	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:01:25.377152	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
137	\N	aeisenmann	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:01:26.637461	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
138	\N	aeisenmann	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:02:05.786042	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
139	\N	aeisenmann	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:02:06.961612	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
140	\N	aeisenmann	failed_login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:04:31.548976	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
141	\N	aeisenmann	failed_login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:04:32.74803	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
142	\N	aeisenmann	failed_login	34.10.58.214	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:05:04.062298	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
143	\N	aeisenmann	failed_login	34.68.1.153	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:05:05.306459	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
145	\N	aeisenmann	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:08:11.378885	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
146	\N	aeisenmann	failed_login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:08:12.592999	f	TypeError [ERR_INVALID_ARG_TYPE]: The "salt" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, or DataView. Received undefined
147	1	leazimmer	login	10.83.8.108	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 08:26:08.447124	t	\N
148	\N	aeisenmann	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:38:23.222627	f	RangeError: Input buffers must have the same byte length
149	\N	aeisenmann	failed_login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:38:24.578431	f	RangeError: Input buffers must have the same byte length
150	\N	aeisenmann	failed_login	34.30.141.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:38:47.565962	f	RangeError: Input buffers must have the same byte length
151	\N	aeisenmann	failed_login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:38:48.866817	f	RangeError: Input buffers must have the same byte length
152	\N	aeisenmann	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:41:37.518003	f	RangeError: Input buffers must have the same byte length
153	\N	aeisenmann	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:41:38.766906	f	RangeError: Input buffers must have the same byte length
154	\N	aeisenmann	failed_login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:49:43.374137	f	RangeError: Input buffers must have the same byte length
155	\N	aeisenmann	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:49:44.727523	f	RangeError: Input buffers must have the same byte length
156	9	aeisenmann	login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:51:50.999507	t	\N
157	9	aeisenmann	logout	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:52:47.385729	t	\N
158	9	aeisenmann	login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:53:12.709499	t	\N
159	9	aeisenmann	logout	35.202.5.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:57:12.488984	t	\N
160	9	aeisenmann	login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:58:43.011028	t	\N
161	9	aeisenmann	logout	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-24 14:59:27.375034	t	\N
162	1	leazimmer	logout	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 12:34:30.080044	t	\N
163	1	leazimmer	login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 12:37:36.666556	t	\N
164	\N	ckazek	failed_login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 16:37:24.806139	f	Ungültiger Benutzername oder Passwort
165	\N	ckazek	failed_login	35.188.87.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 16:37:25.931559	f	Ungültiger Benutzername oder Passwort
166	\N	ckazek	failed_login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 16:37:52.684933	f	Ungültiger Benutzername oder Passwort
167	\N	ckazek	failed_login	34.46.100.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 16:37:53.789888	f	Ungültiger Benutzername oder Passwort
168	\N	ckazek	failed_login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 16:38:04.456608	f	Ungültiger Benutzername oder Passwort
169	\N	ckazek	failed_login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 16:38:05.595872	f	Ungültiger Benutzername oder Passwort
170	\N	ckazek	failed_login	35.188.87.224	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-25 16:42:45.789945	f	Ungültiger Benutzername oder Passwort
171	\N	ckazek	failed_login	34.46.100.90	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-25 16:42:46.977175	f	Ungültiger Benutzername oder Passwort
172	\N	c.kazek@gmx.de	failed_login	34.44.94.57	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-25 16:43:04.43962	f	Ungültiger Benutzername oder Passwort
173	\N	c.kazek@gmx.de	failed_login	34.44.94.57	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-25 16:43:05.626612	f	Ungültiger Benutzername oder Passwort
174	\N	rkuisle	failed_login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 19:50:44.990685	f	Ungültiger Benutzername oder Passwort
175	\N	rkuisle	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 19:50:46.284124	f	Ungültiger Benutzername oder Passwort
176	\N	rkuisle	failed_login	35.188.87.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 19:51:26.704007	f	Ungültiger Benutzername oder Passwort
177	\N	rkuisle	failed_login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 19:51:28.000492	f	Ungültiger Benutzername oder Passwort
179	1	leazimmer	logout	34.10.58.214	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 20:54:56.129457	t	\N
180	\N	leazimmer	failed_login	35.188.87.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 21:25:10.290483	f	Ungültiger Benutzername oder Passwort
181	\N	leazimmer	failed_login	34.30.141.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 21:25:11.600643	f	Ungültiger Benutzername oder Passwort
182	\N	leazimmer	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 21:25:24.073543	f	Ungültiger Benutzername oder Passwort
183	\N	leazimmer	failed_login	34.44.94.57	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 21:25:25.452227	f	Ungültiger Benutzername oder Passwort
184	1	leazimmer	login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-25 21:25:34.980456	t	\N
185	1	leazimmer	logout	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-26 07:37:32.889197	t	\N
186	1	leazimmer	login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-26 07:38:00.180008	t	\N
187	1	leazimmer	logout	35.188.87.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-26 08:55:51.445316	t	\N
188	1	leazimmer	login	35.188.87.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-26 08:55:56.621768	t	\N
189	1	leazimmer	login	34.10.58.214	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-26 12:49:10.685072	t	\N
190	1	leazimmer	logout	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-26 13:42:52.652671	t	\N
191	1	leazimmer	logout	34.136.200.227	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-26 18:02:09.961574	t	\N
192	\N	leazimmer	failed_login	35.238.235.161	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-26 18:02:32.242393	f	Ungültiger Benutzername oder Passwort
193	\N	leazimmer	failed_login	35.238.235.161	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-26 18:02:33.668642	f	Ungültiger Benutzername oder Passwort
194	1	leazimmer	login	35.238.235.161	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-26 18:02:49.131274	t	\N
195	1	leazimmer	logout	34.68.1.153	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-26 19:11:26.589635	t	\N
196	1	leazimmer	logout	10.83.9.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:03:32.52077	t	\N
197	\N	annasusi	register	10.83.9.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:04:20.111719	f	E-Mail-Adresse bereits verwendet
198	\N	annasusi	register	10.83.9.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:04:31.56402	f	E-Mail-Adresse bereits verwendet
199	\N	annasusi	register	10.83.9.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:04:42.919106	f	NeonDbError: invalid input value for enum user_roles: "managerin"
200	\N	susimaier	register	10.83.8.18	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:10:30.159827	f	Benutzername existiert bereits
201	\N	susimaier	register	10.83.8.18	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:10:40.430524	f	Benutzername existiert bereits
202	\N	Schauenwir	register	10.83.8.18	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:10:52.565486	f	NeonDbError: invalid input value for enum user_roles: "managerin"
203	\N	Schauenwir	register	10.83.8.18	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:11:01.7111	f	NeonDbError: invalid input value for enum user_roles: "managerin"
206	\N	kasper	failed_login	10.83.2.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:49:17.694403	f	Ungültiger Benutzername oder Passwort
207	\N	Kaper	failed_login	10.83.2.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:49:23.742467	f	Ungültiger Benutzername oder Passwort
208	\N	Kasper	failed_login	10.83.9.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 06:51:12.649491	f	Ungültiger Benutzername oder Passwort
209	1	leazimmer	login	127.0.0.1	curl/8.11.1	2025-04-27 07:06:52.717617	t	\N
210	\N	leazimmer	failed_login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:10:18.657593	f	Ungültiger Benutzername oder Passwort
211	\N	leazimmer	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:10:20.024074	f	Ungültiger Benutzername oder Passwort
212	\N	leazimmer	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:10:40.030339	f	Ungültiger Benutzername oder Passwort
213	\N	leazimmer	failed_login	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:10:41.389731	f	Ungültiger Benutzername oder Passwort
214	\N	leazimmer	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:10:48.671792	f	Ungültiger Benutzername oder Passwort
215	\N	leazimmer	failed_login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:10:49.976853	f	Ungültiger Benutzername oder Passwort
223	15	CKazek	register	35.202.5.198	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-27 08:09:00.728574	t	\N
216	\N	leazimmer	failed_login	35.238.235.161	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:11:17.252405	f	Ungültiger Benutzername oder Passwort
217	\N	leazimmer	failed_login	34.72.101.37	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:11:18.713464	f	Ungültiger Benutzername oder Passwort
218	1	leazimmer	login	35.188.87.224	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:16:04.986308	t	\N
219	1	leazimmer	logout	34.136.200.227	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:18:31.600299	t	\N
220	1	leazimmer	login	127.0.0.1	curl/8.11.1	2025-04-27 07:20:49.660095	t	\N
221	1	leazimmer	login	10.83.4.167	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:29:20.027206	t	\N
222	1	leazimmer	login	34.46.100.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 07:48:45.936803	t	\N
224	1	leazimmer	logout	10.83.2.190	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 08:45:40.032347	t	\N
225	1	leazimmer	login	10.83.3.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 08:45:58.814525	t	\N
226	1	leazimmer	login	34.72.101.37	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-27 10:38:41.081203	t	\N
227	1	leazimmer	logout	10.83.3.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 11:09:07.319747	t	\N
228	1	leazimmer	login	10.83.8.18	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 11:09:20.861347	t	\N
229	1	leazimmer	logout	10.83.9.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 11:14:14.518476	t	\N
230	1	leazimmer	login	10.83.9.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 11:14:42.826548	t	\N
231	1	leazimmer	login	35.202.5.198	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0	2025-04-27 11:15:38.936854	t	\N
232	1	leazimmer	logout	10.83.3.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 11:20:33.368514	t	\N
233	1	leazimmer	login	10.83.3.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 11:26:49.487653	t	\N
234	16	dilekklc248@gmail.com	register	35.238.235.161	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-27 11:49:46.591876	t	\N
235	16	dilekklc248@gmail.com	logout	34.136.200.227	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-27 11:50:03.461104	t	\N
236	16	dilekklc248@gmail.com	login	34.136.200.227	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-27 11:50:06.857395	t	\N
237	16	dilekklc248@gmail.com	logout	34.72.101.37	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-27 11:50:16.932435	t	\N
238	16	dilekklc248@gmail.com	login	34.136.200.227	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36	2025-04-27 11:50:19.855515	t	\N
239	1	leazimmer	logout	10.83.3.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 13:28:14.415978	t	\N
240	1	leazimmer	login	10.83.9.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0	2025-04-27 13:28:29.355432	t	\N
241	1	leazimmer	logout	35.193.50.36	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-27 13:59:32.067067	t	\N
242	1	leazimmer	login	35.193.50.36	Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_10 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1	2025-04-27 14:53:57.261879	t	\N
\.


--
-- TOC entry 3651 (class 0 OID 24613)
-- Dependencies: 222
-- Data for Name: tblmaterial; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblmaterial (id, material_id, material_name, material_amount, material_price, material_total) FROM stdin;
\.


--
-- TOC entry 3673 (class 0 OID 114702)
-- Dependencies: 244
-- Data for Name: tblmilestonedetails; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblmilestonedetails (id, milestone_id, kalenderwoche, jahr, text, supplementary_info, created_at, ewb_foeb, soll_menge) FROM stdin;
1	5	16	2025			2025-04-18 14:44:33.455636+00	keine	134
\.


--
-- TOC entry 3671 (class 0 OID 114689)
-- Dependencies: 242
-- Data for Name: tblmilestones; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblmilestones (id, project_id, name, start_kw, end_kw, jahr, color, type, created_at, ewb_foeb, soll_menge, bauphase) FROM stdin;
4	2	NVT039	43	46	2025	#4F46E5	Bauleiter	2025-04-18 13:00:40.493369+00	FÖB	122	Sonstiges
5	3	NVT224	16	17	2025	#4F46E5	Tiefbau	2025-04-18 14:22:02.445767+00	EWB,FÖB	234	Sonstiges
6	2	NVT004	17	18	2025	#4F46E5	NVT Montage	2025-04-20 06:48:49.123235+00	FÖB	232	Baustart Tiefbau EWB
\.


--
-- TOC entry 3682 (class 0 OID 196612)
-- Dependencies: 253
-- Data for Name: tblpermissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblpermissions (id, project_id, permission_type, permission_authority, permission_date, permission_notes, created_at) FROM stdin;
\.


--
-- TOC entry 3680 (class 0 OID 196608)
-- Dependencies: 251
-- Data for Name: tblpermissions_backup; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblpermissions_backup (id, project_id, permission_name, permission_date, created_at) FROM stdin;
\.


--
-- TOC entry 3679 (class 0 OID 188417)
-- Dependencies: 250
-- Data for Name: tblpermissions_old; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblpermissions_old (id, project_id, permission_name, permission_date, created_at) FROM stdin;
\.


--
-- TOC entry 3653 (class 0 OID 24622)
-- Dependencies: 224
-- Data for Name: tblperson; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblperson (id, person_id, project_id, company_id, professional_name, firstname, lastname) FROM stdin;
1	\N	\N	3	\N	Hannes	Müller
2	\N	\N	4	\N	Judith	Sauer
3	\N	\N	5	\N	Manfred	Lauter
\.


--
-- TOC entry 3655 (class 0 OID 24629)
-- Dependencies: 226
-- Data for Name: tblproject; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblproject (id, project_id, customer_id, company_id, person_id, permission, permission_name, project_cluster, project_name, project_art, project_width, project_length, project_height, project_text, project_startdate, project_enddate, project_stop, project_stopstartdate, project_stopenddate, project_notes, customer_contact_id, created_by, created_at, permission_date) FROM stdin;
2	\N	6	4	1	f			Baustelle Oberbrunn	Tiefbau	\N	\N	\N	\N	2025-04-29	2025-05-07	f	\N	\N	\N	6	1	2025-04-18 14:50:14.370962	\N
3	\N	7	4	2	f		1	Weilheim	Tiefbau	\N	\N	\N	\N	2025-04-15	2025-05-15	f	\N	\N	\N	7	1	2025-04-18 14:50:14.370962	\N
5	\N	\N	\N	\N	f	\N	\N	Bogenschießplatz Outdoor	Tiefbau	\N	\N	\N	\N	2025-04-17	2025-09-29	f	\N	\N	\N	\N	9	2025-04-22 14:16:28.191763	\N
\.


--
-- TOC entry 3664 (class 0 OID 73756)
-- Dependencies: 235
-- Data for Name: tblsoil_reference_data; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblsoil_reference_data (id, bodenklasse, bezeichnung, beschreibung, korngroesse, durchlaessigkeit, tragfaehigkeit, empfohlene_verdichtung, empfohlene_belastungsklasse, eigenschaften, referenzbild_path, created_at) FROM stdin;
8	Kies	Kiesboden	Grobkörniger, gut drainierter Boden mit hoher Tragfähigkeit	2-63 mm	Sehr gut	F3	Vibrationsverdichtung, Schichtstärke 30-50 cm	Bk32	Hohe Scherfestigkeit, gute Tragfähigkeit, frostunempfindlich	\N	2025-04-07 13:48:29.738988
9	Sand	Sandboden	Mittelkörniger Boden mit guter Drainage	0,063-2 mm	Gut	F2	Vibrationsverdichtung, Schichtstärke 20-30 cm	Bk10	Mittlere Scherfestigkeit, frostunempfindlich bei geringem Feinkornanteil	\N	2025-04-07 13:48:29.738988
10	Lehm	Lehmboden	Gemischter Boden aus Sand, Schluff und Ton	0,002-2 mm (gemischt)	Mäßig	F2	Statische Verdichtung, optimaler Wassergehalt wichtig	Bk3.2	Mittlere Plastizität, bedingt frostempfindlich, empfindlich gegen Wassergehaltsschwankungen	\N	2025-04-07 13:48:29.738988
11	Ton	Tonboden	Feinkörniger, bindiger Boden mit geringer Durchlässigkeit	< 0,002 mm	Sehr gering	F1	Stampfverdichtung, dünne Schichten (15-20 cm)	Bk1.8	Hohe Plastizität, quellfähig, stark frostempfindlich	\N	2025-04-07 13:48:29.738988
12	Humus	Humusboden	Organischer Boden mit hohem Humusanteil	Variabel	Variabel	F1	Ungeeignet für direkte Belastung, Austausch empfohlen	Bk0.3	Stark setzungsempfindlich, ungeeignet für Tragschichten, muss ausgetauscht werden	\N	2025-04-07 13:48:29.738988
13	Fels	Felsboden	Anstehender Fels oder Gestein mit sehr hoher Tragfähigkeit	Massiv	Sehr gering (außer bei Klüftung)	F3	Keine Verdichtung erforderlich	Bk100	Höchste Tragfähigkeit, kein Frostproblem, evtl. Sprengung oder hydraulische Methoden erforderlich	\N	2025-04-07 13:48:29.738988
14	Schotter	Schotterboden	Gebrochenes, kantiges Gesteinsmaterial	> 2 mm, meist 32-63 mm	Sehr gut	F3	Vibrationsverdichtung, Schichtstärke 20-30 cm	Bk32	Sehr gute Verschachtelung, hohe Stabilität, hervorragende Tragfähigkeit	\N	2025-04-07 13:48:29.738988
\.


--
-- TOC entry 3690 (class 0 OID 253984)
-- Dependencies: 261
-- Data for Name: tblsubscription_plans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblsubscription_plans (id, plan_id, name, description, price, "interval", features, stripe_price_id, is_active, sort_order, created_at, updated_at) FROM stdin;
1	basic	Basic	Grundlegende Funktionen für kleine Projekte	39.99	month	["Bis zu 5 aktive Projekte", "Grundlegende Projektdokumentation", "Einfache Meilensteinplanung", "Basisdateiverwaltung"]	price_basic	t	1	2025-04-25 09:24:24.071329+00	\N
2	professional	Professional	Erweiterte Funktionen für mittelgroße Projekte	79.99	month	["Bis zu 20 aktive Projekte", "Erweiterte Projektdokumentation", "Komplexe Meilensteinplanung", "Umfassende Dateiverwaltung", "Benutzerbasierte Zugriffskontrolle", "KI-basierte Baustellenanalyse", "Erweiterte Berichterstattung"]	price_professional	t	2	2025-04-25 09:24:24.071329+00	\N
3	enterprise	Enterprise	Vollständige Funktionspalette für große Projekte	149.99	month	["Unbegrenzte aktive Projekte", "Vollständige Projektdokumentation", "Erweiterte Meilensteinplanung mit Abhängigkeiten", "Umfassende Dateiverwaltung mit KI-Klassifikation", "Erweiterte Benutzer- und Rollenverwaltung", "Vollständige KI-basierte Baustellenanalyse", "Anpassbare Berichte und Dashboards", "Dedizierter Support"]	price_enterprise	t	3	2025-04-25 09:24:24.071329+00	\N
\.


--
-- TOC entry 3662 (class 0 OID 65537)
-- Dependencies: 233
-- Data for Name: tblsurface_analysis; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblsurface_analysis (id, project_id, latitude, longitude, location_name, street, house_number, postal_code, city, notes, image_file_path, visualization_file_path, belastungsklasse, asphalttyp, confidence, analyse_details, created_at, bodenklasse, bodentragfaehigkeitsklasse, ground_image_file_path, ground_confidence, ground_analyse_details, analysis_type) FROM stdin;
\.


--
-- TOC entry 3657 (class 0 OID 24640)
-- Dependencies: 228
-- Data for Name: tbluser; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tbluser (id, username, password, user_name, user_email, role, created_by, gdpr_consent, trial_end_date, subscription_status, stripe_customer_id, stripe_subscription_id, last_payment_date, subscription_plan, mobile_number) FROM stdin;
1	leazimmer	4828a524925f1e0eaf998c7098e320bb461785b374a78b6d9be8773eed73c2c4df89545f11a9f6af51ab47c25d52934edf4be121ba84697c7a337a19428eee88.cbfc45dc865d39109cc3a92041175586	Zimmer	lea.zimmer@gmx.net	administrator	\N	f	2025-05-25	\N	\N	\N	\N	basic	+4915233531845
15	CKazek	58f9fadc5e9614d74e0fee3f7d471aa6535e81dc5c3c6b137a3ffbc8e34e37f20ae34ad2254b3c424d03688772ce5e1c6ea1b7925434c0d088efd8955dc8ae58.2faa57f7a845a0859ea8a5ea478ef584	Corinna Kazek	corinna.kazek@example.com	manager	\N	f	2025-05-25	trial	\N	\N	\N	basic	\N
8	rkuisle	91925520a8a6fbd06c1030c226a3b493d168e51dd5a0600d895ec168f6499b38aee7007670563b1c43729ae4ed481dba3afbf6d798ff4f110ca6203b275105e6.038d8bc8ee2142fcd906d37efe0c0ed1	René Kuisle	Rene.Kuisle@netz-germany.de	manager	1	t	2025-05-25	trial	\N	\N	2025-04-27	basic	\N
16	dilekklc248@gmail.com	a2c88c67da5223603dcb730116c8fa4adf6d30e9309ccb2dce3e0e6b023b16add1e18cafde580e94014128b9ebd2ecb539a2154d9a9885ab6a907c9336c210ae.31e9dab33465f002c632686a99e8f503	\N	\N	manager	\N	f	\N	trial	\N	\N	\N	basic	\N
9	aeisenmann	$2b$10$o9EenNwXntxKgbMLQVKOeuULJ.Y8U.aTmq54MBflil/L4AZIA5TAa	Alexander Eisenmann	alexandereisenmann@sachverstandigenburojustiti.onmicrosoft.com	manager	1	t	2025-05-20	active	\N	\N	\N	basic	\N
\.


--
-- TOC entry 3694 (class 0 OID 270337)
-- Dependencies: 265
-- Data for Name: tbluser_subscriptions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tbluser_subscriptions (id, user_id, status, plan_id, trial_end_date, last_payment_date, next_payment_date, stripe_customer_id, stripe_subscription_id, cancel_at_period_end, created_at, updated_at) FROM stdin;
1	1	\N	basic	2025-05-25 00:00:00	\N	\N	\N	\N	f	2025-04-27 09:50:01.885374	2025-04-27 09:50:01.885374
2	15	trial	basic	2025-05-25 00:00:00	\N	\N	\N	\N	f	2025-04-27 09:50:01.885374	2025-04-27 09:50:01.885374
3	8	trial	basic	2025-05-25 00:00:00	2025-04-27 00:00:00	\N	\N	\N	f	2025-04-27 09:50:01.885374	2025-04-27 09:50:01.885374
4	9	active	basic	2025-05-20 00:00:00	\N	\N	\N	\N	f	2025-04-27 09:50:01.885374	2025-04-27 09:50:01.885374
5	16	trial	basic	2025-05-25 11:49:46.225	\N	\N	\N	\N	f	2025-04-27 11:49:46.225	2025-04-27 11:49:46.225
\.


--
-- TOC entry 3677 (class 0 OID 163846)
-- Dependencies: 248
-- Data for Name: tblverification_codes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tblverification_codes (id, user_id, code, type, created_at, expires_at, used_at, is_valid) FROM stdin;
1	1	262703	login	2025-04-19 06:18:06.014637	2025-04-19 06:28:05.993	\N	t
2	1	441151	login	2025-04-19 06:35:41.836255	2025-04-19 06:45:41.815	\N	t
3	1	197269	login	2025-04-19 06:37:05.992101	2025-04-19 06:47:05.97	\N	t
5	1	719467	login	2025-04-19 06:47:54.711889	2025-04-19 06:57:54.691	\N	t
4	1	147812	login	2025-04-19 06:43:23.799869	2025-04-19 06:53:23.776	2025-04-19 06:48:27.017	f
6	1	259019	login	2025-04-19 06:48:29.545293	2025-04-19 06:58:29.525	\N	t
7	1	375346	login	2025-04-19 07:06:34.570792	2025-04-19 07:16:34.551	\N	t
8	1	623699	password_reset	2025-04-19 07:07:09.88786	2025-04-19 08:07:09.779	\N	t
9	1	867587	login	2025-04-19 07:07:09.915023	2025-04-19 07:17:09.895	\N	t
10	1	995619	login	2025-04-19 10:23:02.972864	2025-04-19 10:33:02.952	\N	t
11	1	444637	login	2025-04-19 10:36:46.297345	2025-04-19 10:46:46.276	2025-04-19 10:42:36.573	f
12	1	871135	login	2025-04-19 10:42:40.32746	2025-04-19 10:52:40.307	\N	t
13	1	323572	login	2025-04-19 10:42:43.042222	2025-04-19 10:52:43.021	\N	t
15	1	746519	password_reset	2025-04-19 11:57:16.568114	2025-04-19 12:57:14.461	\N	t
14	1	704259	login	2025-04-19 11:57:15.977203	2025-04-19 12:07:15.955	2025-04-19 11:58:23.823	f
16	1	571246	login	2025-04-19 12:15:57.939133	2025-04-19 12:25:57.919	\N	t
17	1	204531	login	2025-04-19 12:16:07.124777	2025-04-19 12:26:07.1	\N	t
18	1	451605	login	2025-04-19 12:16:15.087156	2025-04-19 12:26:15.066	\N	t
19	1	600288	login	2025-04-19 12:16:21.704313	2025-04-19 12:26:21.684	\N	t
\.


--
-- TOC entry 3736 (class 0 OID 0)
-- Dependencies: 258
-- Name: email_queue_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.email_queue_id_seq', 7, true);


--
-- TOC entry 3737 (class 0 OID 0)
-- Dependencies: 262
-- Name: sms_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sms_logs_id_seq', 4, true);


--
-- TOC entry 3738 (class 0 OID 0)
-- Dependencies: 239
-- Name: tblBedarfKapa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."tblBedarfKapa_id_seq"', 4, true);


--
-- TOC entry 3739 (class 0 OID 0)
-- Dependencies: 230
-- Name: tblattachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblattachment_id_seq', 14, true);


--
-- TOC entry 3740 (class 0 OID 0)
-- Dependencies: 215
-- Name: tblcompany_company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblcompany_company_id_seq', 8, true);


--
-- TOC entry 3741 (class 0 OID 0)
-- Dependencies: 217
-- Name: tblcomponent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblcomponent_id_seq', 1, false);


--
-- TOC entry 3742 (class 0 OID 0)
-- Dependencies: 256
-- Name: tblconstruction_diary_employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblconstruction_diary_employees_id_seq', 1, false);


--
-- TOC entry 3743 (class 0 OID 0)
-- Dependencies: 254
-- Name: tblconstruction_diary_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblconstruction_diary_id_seq', 1, true);


--
-- TOC entry 3744 (class 0 OID 0)
-- Dependencies: 219
-- Name: tblcustomer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblcustomer_id_seq', 8, true);


--
-- TOC entry 3745 (class 0 OID 0)
-- Dependencies: 236
-- Name: tblfile_organization_suggestion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblfile_organization_suggestion_id_seq', 1, false);


--
-- TOC entry 3746 (class 0 OID 0)
-- Dependencies: 245
-- Name: tbllogin_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tbllogin_logs_id_seq', 242, true);


--
-- TOC entry 3747 (class 0 OID 0)
-- Dependencies: 221
-- Name: tblmaterial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblmaterial_id_seq', 1, false);


--
-- TOC entry 3748 (class 0 OID 0)
-- Dependencies: 243
-- Name: tblmilestonedetails_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblmilestonedetails_id_seq', 1, true);


--
-- TOC entry 3749 (class 0 OID 0)
-- Dependencies: 241
-- Name: tblmilestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblmilestones_id_seq', 6, true);


--
-- TOC entry 3750 (class 0 OID 0)
-- Dependencies: 249
-- Name: tblpermissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblpermissions_id_seq', 1, false);


--
-- TOC entry 3751 (class 0 OID 0)
-- Dependencies: 252
-- Name: tblpermissions_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblpermissions_id_seq1', 1, false);


--
-- TOC entry 3752 (class 0 OID 0)
-- Dependencies: 223
-- Name: tblperson_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblperson_id_seq', 3, true);


--
-- TOC entry 3753 (class 0 OID 0)
-- Dependencies: 225
-- Name: tblproject_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblproject_id_seq', 5, true);


--
-- TOC entry 3754 (class 0 OID 0)
-- Dependencies: 234
-- Name: tblsoil_reference_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblsoil_reference_data_id_seq', 14, true);


--
-- TOC entry 3755 (class 0 OID 0)
-- Dependencies: 260
-- Name: tblsubscription_plans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblsubscription_plans_id_seq', 3, true);


--
-- TOC entry 3756 (class 0 OID 0)
-- Dependencies: 232
-- Name: tblsurface_analysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblsurface_analysis_id_seq', 1, false);


--
-- TOC entry 3757 (class 0 OID 0)
-- Dependencies: 227
-- Name: tbluser_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tbluser_id_seq', 16, true);


--
-- TOC entry 3758 (class 0 OID 0)
-- Dependencies: 264
-- Name: tbluser_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tbluser_subscriptions_id_seq', 5, true);


--
-- TOC entry 3759 (class 0 OID 0)
-- Dependencies: 247
-- Name: tblverification_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tblverification_codes_id_seq', 19, true);


--
-- TOC entry 3467 (class 2606 OID 253974)
-- Name: email_queue email_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.email_queue
    ADD CONSTRAINT email_queue_pkey PRIMARY KEY (id);


--
-- TOC entry 3426 (class 2606 OID 32774)
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- TOC entry 3473 (class 2606 OID 262153)
-- Name: sms_logs sms_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3438 (class 2606 OID 98311)
-- Name: tblBedarfKapa tblBedarfKapa_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."tblBedarfKapa"
    ADD CONSTRAINT "tblBedarfKapa_pkey" PRIMARY KEY (id);


--
-- TOC entry 3428 (class 2606 OID 40969)
-- Name: tblattachment tblattachment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblattachment
    ADD CONSTRAINT tblattachment_pkey PRIMARY KEY (id);


--
-- TOC entry 3409 (class 2606 OID 24593)
-- Name: tblcompany tblcompany_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcompany
    ADD CONSTRAINT tblcompany_pkey PRIMARY KEY (company_id);


--
-- TOC entry 3411 (class 2606 OID 24602)
-- Name: tblcomponent tblcomponent_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcomponent
    ADD CONSTRAINT tblcomponent_pkey PRIMARY KEY (id);


--
-- TOC entry 3465 (class 2606 OID 213001)
-- Name: tblconstruction_diary_employees tblconstruction_diary_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblconstruction_diary_employees
    ADD CONSTRAINT tblconstruction_diary_employees_pkey PRIMARY KEY (id);


--
-- TOC entry 3462 (class 2606 OID 204809)
-- Name: tblconstruction_diary tblconstruction_diary_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblconstruction_diary
    ADD CONSTRAINT tblconstruction_diary_pkey PRIMARY KEY (id);


--
-- TOC entry 3413 (class 2606 OID 24611)
-- Name: tblcustomer tblcustomer_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcustomer
    ADD CONSTRAINT tblcustomer_pkey PRIMARY KEY (id);


--
-- TOC entry 3434 (class 2606 OID 90139)
-- Name: tblfile_organization_suggestion tblfile_organization_suggestion_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_organization_suggestion
    ADD CONSTRAINT tblfile_organization_suggestion_pkey PRIMARY KEY (id);


--
-- TOC entry 3436 (class 2606 OID 90149)
-- Name: tblfile_suggestion_attachment tblfile_suggestion_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_suggestion_attachment
    ADD CONSTRAINT tblfile_suggestion_attachment_pkey PRIMARY KEY (suggestion_id, attachment_id);


--
-- TOC entry 3449 (class 2606 OID 155667)
-- Name: tbllogin_logs tbllogin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbllogin_logs
    ADD CONSTRAINT tbllogin_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3415 (class 2606 OID 24620)
-- Name: tblmaterial tblmaterial_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmaterial
    ADD CONSTRAINT tblmaterial_pkey PRIMARY KEY (id);


--
-- TOC entry 3444 (class 2606 OID 114710)
-- Name: tblmilestonedetails tblmilestonedetails_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestonedetails
    ADD CONSTRAINT tblmilestonedetails_pkey PRIMARY KEY (id);


--
-- TOC entry 3441 (class 2606 OID 114695)
-- Name: tblmilestones tblmilestones_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestones
    ADD CONSTRAINT tblmilestones_pkey PRIMARY KEY (id);


--
-- TOC entry 3455 (class 2606 OID 188423)
-- Name: tblpermissions_old tblpermissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions_old
    ADD CONSTRAINT tblpermissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3457 (class 2606 OID 196620)
-- Name: tblpermissions tblpermissions_pkey1; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions
    ADD CONSTRAINT tblpermissions_pkey1 PRIMARY KEY (id);


--
-- TOC entry 3417 (class 2606 OID 24627)
-- Name: tblperson tblperson_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblperson
    ADD CONSTRAINT tblperson_pkey PRIMARY KEY (id);


--
-- TOC entry 3419 (class 2606 OID 24638)
-- Name: tblproject tblproject_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblproject
    ADD CONSTRAINT tblproject_pkey PRIMARY KEY (id);


--
-- TOC entry 3432 (class 2606 OID 73764)
-- Name: tblsoil_reference_data tblsoil_reference_data_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsoil_reference_data
    ADD CONSTRAINT tblsoil_reference_data_pkey PRIMARY KEY (id);


--
-- TOC entry 3469 (class 2606 OID 253995)
-- Name: tblsubscription_plans tblsubscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsubscription_plans
    ADD CONSTRAINT tblsubscription_plans_pkey PRIMARY KEY (id);


--
-- TOC entry 3471 (class 2606 OID 253997)
-- Name: tblsubscription_plans tblsubscription_plans_plan_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsubscription_plans
    ADD CONSTRAINT tblsubscription_plans_plan_id_key UNIQUE (plan_id);


--
-- TOC entry 3430 (class 2606 OID 65545)
-- Name: tblsurface_analysis tblsurface_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsurface_analysis
    ADD CONSTRAINT tblsurface_analysis_pkey PRIMARY KEY (id);


--
-- TOC entry 3421 (class 2606 OID 24647)
-- Name: tbluser tbluser_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser
    ADD CONSTRAINT tbluser_pkey PRIMARY KEY (id);


--
-- TOC entry 3478 (class 2606 OID 270348)
-- Name: tbluser_subscriptions tbluser_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser_subscriptions
    ADD CONSTRAINT tbluser_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3423 (class 2606 OID 24649)
-- Name: tbluser tbluser_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser
    ADD CONSTRAINT tbluser_username_unique UNIQUE (username);


--
-- TOC entry 3453 (class 2606 OID 163854)
-- Name: tblverification_codes tblverification_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblverification_codes
    ADD CONSTRAINT tblverification_codes_pkey PRIMARY KEY (id);


--
-- TOC entry 3480 (class 2606 OID 270350)
-- Name: tbluser_subscriptions unique_user_subscription; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser_subscriptions
    ADD CONSTRAINT unique_user_subscription UNIQUE (user_id);


--
-- TOC entry 3424 (class 1259 OID 32775)
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- TOC entry 3458 (class 1259 OID 204821)
-- Name: construction_diary_date_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX construction_diary_date_idx ON public.tblconstruction_diary USING btree (date);


--
-- TOC entry 3459 (class 1259 OID 204822)
-- Name: construction_diary_employee_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX construction_diary_employee_idx ON public.tblconstruction_diary USING btree (employee);


--
-- TOC entry 3460 (class 1259 OID 204820)
-- Name: construction_diary_project_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX construction_diary_project_id_idx ON public.tblconstruction_diary USING btree (project_id);


--
-- TOC entry 3463 (class 1259 OID 213007)
-- Name: idx_construction_diary_employees_diary_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_construction_diary_employees_diary_id ON public.tblconstruction_diary_employees USING btree (construction_diary_id);


--
-- TOC entry 3445 (class 1259 OID 155674)
-- Name: idx_login_logs_event_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_login_logs_event_type ON public.tbllogin_logs USING btree (event_type);


--
-- TOC entry 3446 (class 1259 OID 155675)
-- Name: idx_login_logs_timestamp; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_login_logs_timestamp ON public.tbllogin_logs USING btree ("timestamp");


--
-- TOC entry 3447 (class 1259 OID 155673)
-- Name: idx_login_logs_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_login_logs_user_id ON public.tbllogin_logs USING btree (user_id);


--
-- TOC entry 3442 (class 1259 OID 114717)
-- Name: idx_milestone_details_milestone; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_milestone_details_milestone ON public.tblmilestonedetails USING btree (milestone_id);


--
-- TOC entry 3439 (class 1259 OID 114716)
-- Name: idx_milestone_project; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_milestone_project ON public.tblmilestones USING btree (project_id);


--
-- TOC entry 3474 (class 1259 OID 270363)
-- Name: idx_user_subscriptions_plan_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_subscriptions_plan_id ON public.tbluser_subscriptions USING btree (plan_id);


--
-- TOC entry 3475 (class 1259 OID 270362)
-- Name: idx_user_subscriptions_status; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_subscriptions_status ON public.tbluser_subscriptions USING btree (status);


--
-- TOC entry 3476 (class 1259 OID 270361)
-- Name: idx_user_subscriptions_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_user_subscriptions_user_id ON public.tbluser_subscriptions USING btree (user_id);


--
-- TOC entry 3450 (class 1259 OID 163860)
-- Name: idx_verification_codes_code; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_verification_codes_code ON public.tblverification_codes USING btree (code);


--
-- TOC entry 3451 (class 1259 OID 163861)
-- Name: idx_verification_codes_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_verification_codes_user_id ON public.tblverification_codes USING btree (user_id);


--
-- TOC entry 3489 (class 2606 OID 98312)
-- Name: tblBedarfKapa tblBedarfKapa_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."tblBedarfKapa"
    ADD CONSTRAINT "tblBedarfKapa_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.tblproject(id);


--
-- TOC entry 3484 (class 2606 OID 40970)
-- Name: tblattachment tblattachment_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblattachment
    ADD CONSTRAINT tblattachment_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id);


--
-- TOC entry 3496 (class 2606 OID 204815)
-- Name: tblconstruction_diary tblconstruction_diary_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblconstruction_diary
    ADD CONSTRAINT tblconstruction_diary_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.tbluser(id);


--
-- TOC entry 3498 (class 2606 OID 213002)
-- Name: tblconstruction_diary_employees tblconstruction_diary_employees_construction_diary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblconstruction_diary_employees
    ADD CONSTRAINT tblconstruction_diary_employees_construction_diary_id_fkey FOREIGN KEY (construction_diary_id) REFERENCES public.tblconstruction_diary(id) ON DELETE CASCADE;


--
-- TOC entry 3497 (class 2606 OID 204810)
-- Name: tblconstruction_diary tblconstruction_diary_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblconstruction_diary
    ADD CONSTRAINT tblconstruction_diary_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id);


--
-- TOC entry 3481 (class 2606 OID 229376)
-- Name: tblcustomer tblcustomer_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblcustomer
    ADD CONSTRAINT tblcustomer_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.tbluser(id);


--
-- TOC entry 3486 (class 2606 OID 90140)
-- Name: tblfile_organization_suggestion tblfile_organization_suggestion_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_organization_suggestion
    ADD CONSTRAINT tblfile_organization_suggestion_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id) ON DELETE CASCADE;


--
-- TOC entry 3487 (class 2606 OID 90155)
-- Name: tblfile_suggestion_attachment tblfile_suggestion_attachment_attachment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_suggestion_attachment
    ADD CONSTRAINT tblfile_suggestion_attachment_attachment_id_fkey FOREIGN KEY (attachment_id) REFERENCES public.tblattachment(id) ON DELETE CASCADE;


--
-- TOC entry 3488 (class 2606 OID 90150)
-- Name: tblfile_suggestion_attachment tblfile_suggestion_attachment_suggestion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblfile_suggestion_attachment
    ADD CONSTRAINT tblfile_suggestion_attachment_suggestion_id_fkey FOREIGN KEY (suggestion_id) REFERENCES public.tblfile_organization_suggestion(id) ON DELETE CASCADE;


--
-- TOC entry 3492 (class 2606 OID 155668)
-- Name: tbllogin_logs tbllogin_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbllogin_logs
    ADD CONSTRAINT tbllogin_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tbluser(id);


--
-- TOC entry 3491 (class 2606 OID 114711)
-- Name: tblmilestonedetails tblmilestonedetails_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestonedetails
    ADD CONSTRAINT tblmilestonedetails_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.tblmilestones(id) ON DELETE CASCADE;


--
-- TOC entry 3490 (class 2606 OID 114696)
-- Name: tblmilestones tblmilestones_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblmilestones
    ADD CONSTRAINT tblmilestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id) ON DELETE CASCADE;


--
-- TOC entry 3494 (class 2606 OID 188424)
-- Name: tblpermissions_old tblpermissions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions_old
    ADD CONSTRAINT tblpermissions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id) ON DELETE CASCADE;


--
-- TOC entry 3495 (class 2606 OID 196621)
-- Name: tblpermissions tblpermissions_project_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblpermissions
    ADD CONSTRAINT tblpermissions_project_id_fkey1 FOREIGN KEY (project_id) REFERENCES public.tblproject(id) ON DELETE CASCADE;


--
-- TOC entry 3482 (class 2606 OID 147470)
-- Name: tblproject tblproject_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblproject
    ADD CONSTRAINT tblproject_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.tbluser(id);


--
-- TOC entry 3485 (class 2606 OID 65546)
-- Name: tblsurface_analysis tblsurface_analysis_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblsurface_analysis
    ADD CONSTRAINT tblsurface_analysis_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.tblproject(id);


--
-- TOC entry 3483 (class 2606 OID 147464)
-- Name: tbluser tbluser_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser
    ADD CONSTRAINT tbluser_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.tbluser(id);


--
-- TOC entry 3499 (class 2606 OID 270356)
-- Name: tbluser_subscriptions tbluser_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser_subscriptions
    ADD CONSTRAINT tbluser_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.tblsubscription_plans(plan_id);


--
-- TOC entry 3500 (class 2606 OID 270351)
-- Name: tbluser_subscriptions tbluser_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tbluser_subscriptions
    ADD CONSTRAINT tbluser_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tbluser(id) ON DELETE CASCADE;


--
-- TOC entry 3493 (class 2606 OID 163855)
-- Name: tblverification_codes tblverification_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tblverification_codes
    ADD CONSTRAINT tblverification_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.tbluser(id);


--
-- TOC entry 2202 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2201 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2025-04-28 06:18:07 UTC

--
-- PostgreSQL database dump complete
--

