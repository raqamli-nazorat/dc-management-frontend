import { useState, useEffect, useRef } from "react"
import { axiosAPI } from "../service/axiosAPI"


// enabled=false bo'lsa so'rov yuborilmaydi (masalan filter modali yopiq turganda).
// fetched ref bilan bir marta yuklanadi — modal qayta ochilganda takror so'rov bo'lmaydi.
export const useRegions = (enabled = true) => {
    const [regions, setRegions] = useState([])
    const fetched = useRef(false)
    useEffect(() => {
        if (!enabled || fetched.current) return
        fetched.current = true
        axiosAPI.get('applications/regions/')
            .then(({ data }) => setRegions(data.data.results))
            .catch((e) => { fetched.current = false; console.error(e) })
    }, [enabled])
    return regions
}

export const useDistricts = (enabled = true) => {
    const [districts, setDistricts] = useState([])
    const fetched = useRef(false)
    useEffect(() => {
        if (!enabled || fetched.current) return
        fetched.current = true
        axiosAPI.get('applications/districts/')
            .then(({ data }) => setDistricts(data.data.results))
            .catch((e) => { fetched.current = false; console.error(e) })
    }, [enabled])
    return districts
}

export const usePositions = (enabled = true) => {
    const [positions, setPositions] = useState([])
    const fetched = useRef(false)
    useEffect(() => {
        if (!enabled || fetched.current) return
        fetched.current = true
        axiosAPI.get('applications/positions/')
            .then(({ data }) => setPositions(data.data.results))
            .catch((e) => { fetched.current = false; console.error(e) })
    }, [enabled])
    return positions
}

export const Roles = {
    admin: 'Admin',
    manager: 'Menejer',
    employee: 'Xodim',
    auditor: 'Nazoratchi',
    accountant: 'Hisobchi',
}

export const Status = {
    pending: "Kutilmoqda",
    accepted: "Qabul qilindi",
    rejected: "Rad etildi"
}