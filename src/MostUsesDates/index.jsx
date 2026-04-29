import { useState, useEffect } from "react"
import { axiosAPI } from "../service/axiosAPI"


export const useRegions = () => {
    const [regions, setRegions] = useState([])
    useEffect(() => {
        axiosAPI.get('applications/regions/')
            .then(({ data }) => setRegions(data.data.results))
            .catch(console.error)
    }, [])
    return regions
}

export const useDistricts = () => {
    const [districts, setDistricts] = useState([])
    useEffect(() => {
        axiosAPI.get('applications/districts/')
            .then(({ data }) => setDistricts(data.data.results))
            .catch(console.error)
    }, [])
    return districts
}

export const usePositions = () => {
    const [positions, setPositions] = useState([])
    useEffect(() => {
        axiosAPI.get('applications/positions/')
            .then(({ data }) => setPositions(data.data.results))
            .catch(console.error)
    }, [])
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