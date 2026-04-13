import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { clearAccessToken } from "../utils/tokenService";

const useLogout = () => {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post("auth/logout/");
    } catch (error) {
      console.log(error);
    }

    clearAccessToken();
    navigate("/");
  };

  return logout;
};

export default useLogout;
