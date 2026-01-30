import { supabaseAdmin } from '../services/supabase.service.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        message: 'Missing Authorization header'
      });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        ok: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email
    };

    next();
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: 'Authentication error'
    });
  }
};
